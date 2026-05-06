import assert from "node:assert/strict";
import "dotenv/config";

const baseUrl = process.env.PRIVATE_PLANNING_TEST_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseUrl).origin;
const passcode = process.env.PRIVATE_PLANNING_TEST_PASSCODE ?? process.env.PRIVATE_PLANNING_PASSCODE;

if (!passcode) {
  throw new Error("Set PRIVATE_PLANNING_PASSCODE or PRIVATE_PLANNING_TEST_PASSCODE before running this smoke test.");
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function login(ipAddress) {
  const response = await fetch(`${baseUrl}/api/private-planning/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "x-forwarded-for": ipAddress,
    },
    body: JSON.stringify({ passcode }),
  });
  const result = await readJson(response);

  assert.equal(response.status, 200, `correct passcode should log in: ${result.error ?? ""}`);

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "login should set a session cookie");

  return setCookie.split(";")[0];
}

async function restorePlanningData(cookie, previousState) {
  if (previousState.hasData) {
    const response = await fetch(`${baseUrl}/api/private-planning/data`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        origin,
        cookie,
        "x-private-planning-csrf": "1",
      },
      body: JSON.stringify(previousState.data),
    });

    assert.equal(response.status, 200, `planning data restore should succeed: ${await response.text()}`);
    return;
  }

  const response = await fetch(`${baseUrl}/api/private-planning/data`, {
    method: "DELETE",
    headers: {
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
  });

  assert.equal(response.status, 200, `planning data cleanup should succeed: ${await response.text()}`);
}

const testRunId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const page = await fetch(`${baseUrl}/private-planning`, { redirect: "manual" });
const pageText = await page.text();
assert.equal(page.status, 200, "private planning page should render");
assert.match(pageText, /Private Planning/, "unauthenticated page should show login copy");
assert.doesNotMatch(pageText, /Vendors/, "unauthenticated page should not render dashboard tabs");

const unauthenticatedData = await fetch(`${baseUrl}/api/private-planning/data`);
assert.equal(unauthenticatedData.status, 401, "data API should reject unauthenticated requests");
assert.equal(unauthenticatedData.headers.get("cache-control"), "no-store", "private API responses should not be cached");

const unauthenticatedFiles = await fetch(`${baseUrl}/api/private-planning/files`);
assert.equal(unauthenticatedFiles.status, 401, "file list API should reject unauthenticated requests");

const unauthenticatedUpload = await fetch(`${baseUrl}/api/private-planning/files`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({ originalFilename: "invoice.pdf", size: 1024 }),
});
assert.equal(unauthenticatedUpload.status, 401, "file upload ticket API should reject unauthenticated requests");

const unauthenticatedClientUpload = await fetch(`${baseUrl}/api/private-planning/files/upload`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({
    type: "blob.generate-client-token",
    payload: {
      pathname: "private-planning/files/blocked.pdf",
      multipart: false,
      clientPayload: null,
    },
  }),
});
assert.equal(unauthenticatedClientUpload.status, 401, "file client-upload route should reject unauthenticated token requests");

const unauthenticatedDownload = await fetch(`${baseUrl}/api/private-planning/files/not-a-file/download`);
assert.equal(unauthenticatedDownload.status, 401, "file download API should reject unauthenticated requests");

const unauthenticatedDelete = await fetch(`${baseUrl}/api/private-planning/files/not-a-file`, {
  method: "DELETE",
  headers: {
    origin,
    "x-private-planning-csrf": "1",
  },
});
assert.equal(unauthenticatedDelete.status, 401, "file delete API should reject unauthenticated requests");

const wrongLogin = await fetch(`${baseUrl}/api/private-planning/login`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-forwarded-for": `203.0.113.${20 + Math.floor(Math.random() * 20)}`,
  },
  body: JSON.stringify({ passcode: "not-the-passcode" }),
});
assert.equal(wrongLogin.status, 401, "wrong passcode should fail");

let limitedStatus = 0;
const rateLimitIp = `203.0.113.${60 + Math.floor(Math.random() * 20)}`;

for (let index = 0; index < 5; index += 1) {
  const response = await fetch(`${baseUrl}/api/private-planning/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "x-forwarded-for": rateLimitIp,
    },
    body: JSON.stringify({ passcode: `wrong-${testRunId}-${index}` }),
  });
  limitedStatus = response.status;
}

assert.equal(limitedStatus, 429, "repeated bad passcodes should be rate-limited");

const cookie = await login(`203.0.113.${100 + Math.floor(Math.random() * 20)}`);
const beforeResponse = await fetch(`${baseUrl}/api/private-planning/data`, {
  headers: { cookie },
});
const previousState = await readJson(beforeResponse);
assert.equal(beforeResponse.status, 200, `authenticated read should succeed: ${previousState.error ?? ""}`);

try {
  const blockedFileType = await fetch(`${baseUrl}/api/private-planning/files`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify({ originalFilename: "invoice.svg", size: 1024 }),
  });
  assert.equal(blockedFileType.status, 400, "SVG upload tickets should be rejected");

  const oversizedFile = await fetch(`${baseUrl}/api/private-planning/files`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify({ originalFilename: "invoice.pdf", size: 11 * 1024 * 1024 }),
  });
  assert.equal(oversizedFile.status, 400, "oversized upload tickets should be rejected");

  const missingFileCsrf = await fetch(`${baseUrl}/api/private-planning/files`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({ originalFilename: "invoice.pdf", size: 1024 }),
  });
  assert.equal(missingFileCsrf.status, 403, "file upload tickets without CSRF should fail");

  const missingCsrf = await fetch(`${baseUrl}/api/private-planning/data`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({ quickNotes: "blocked" }),
  });
  assert.equal(missingCsrf.status, 403, "writes without the CSRF header should fail");

  const smokePayload = {
    quickNotes: `private-planning-smoke-${testRunId}`,
    vendors: [],
    events: [],
    tasks: [],
    timeline: [],
    notes: {},
  };
  const write = await fetch(`${baseUrl}/api/private-planning/data`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify(smokePayload),
  });
  const writeResult = await readJson(write);
  assert.equal(write.status, 200, `authenticated write should succeed: ${writeResult.error ?? ""}`);

  const read = await fetch(`${baseUrl}/api/private-planning/data`, {
    headers: { cookie },
  });
  const readResult = await readJson(read);
  assert.equal(read.status, 200, `authenticated read after write should succeed: ${readResult.error ?? ""}`);
  assert.equal(readResult.data?.quickNotes, smokePayload.quickNotes, "read should return the saved smoke payload");
} finally {
  await restorePlanningData(cookie, previousState);
}

const logout = await fetch(`${baseUrl}/api/private-planning/logout`, {
  method: "POST",
  headers: { origin, cookie },
});
assert.equal(logout.status, 200, "logout should succeed");

const afterLogout = await fetch(`${baseUrl}/api/private-planning/data`, {
  headers: { cookie },
});
assert.equal(afterLogout.status, 401, "revoked session should not access data after logout");

console.log("private planning security smoke checks passed");
