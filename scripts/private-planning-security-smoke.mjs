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

const unauthenticatedGuests = await fetch(`${baseUrl}/api/private-planning/guests`);
assert.equal(unauthenticatedGuests.status, 401, "private guest list API should reject unauthenticated requests");

const unauthenticatedGuestCreate = await fetch(`${baseUrl}/api/private-planning/guests`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({ fullName: "Blocked Guest" }),
});
assert.equal(unauthenticatedGuestCreate.status, 401, "private guest create API should reject unauthenticated requests");

const unauthenticatedGuestExport = await fetch(`${baseUrl}/api/private-planning/guests/export`);
assert.equal(unauthenticatedGuestExport.status, 401, "private guest export API should reject unauthenticated requests");

const unauthenticatedGuestImport = await fetch(`${baseUrl}/api/private-planning/guests/import`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({ guests: [{ fullName: "Blocked Guest" }] }),
});
assert.equal(unauthenticatedGuestImport.status, 401, "private guest import API should reject unauthenticated requests");

const retiredGuestListApi = await fetch(`${baseUrl}/api/guest-list`);
assert.equal(retiredGuestListApi.status, 410, "old guest-list API should not expose guest data");
assert.equal(retiredGuestListApi.headers.get("cache-control"), "no-store", "retired guest-list API should not be cached");

const retiredAdminGuestsApi = await fetch(`${baseUrl}/api/admin/guests`);
assert.equal(retiredAdminGuestsApi.status, 410, "old admin guest API should not expose guest data");

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

const unauthenticatedExtractionRead = await fetch(`${baseUrl}/api/private-planning/files/not-a-file/extraction`);
assert.equal(unauthenticatedExtractionRead.status, 401, "file extraction read API should reject unauthenticated requests");

const unauthenticatedExtraction = await fetch(`${baseUrl}/api/private-planning/files/not-a-file/extract`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({}),
});
assert.equal(unauthenticatedExtraction.status, 401, "file extraction API should reject unauthenticated requests");

const unauthenticatedDelete = await fetch(`${baseUrl}/api/private-planning/files/not-a-file`, {
  method: "DELETE",
  headers: {
    origin,
    "x-private-planning-csrf": "1",
  },
});
assert.equal(unauthenticatedDelete.status, 401, "file delete API should reject unauthenticated requests");

const unauthenticatedSuggestionApply = await fetch(`${baseUrl}/api/private-planning/vendor-suggestions/not-a-suggestion/apply`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin,
    "x-private-planning-csrf": "1",
  },
  body: JSON.stringify({ action: "create" }),
});
assert.equal(unauthenticatedSuggestionApply.status, 401, "suggestion apply API should reject unauthenticated requests");

const unauthenticatedSuggestionDismiss = await fetch(`${baseUrl}/api/private-planning/vendor-suggestions/not-a-suggestion/dismiss`, {
  method: "POST",
  headers: {
    origin,
    "x-private-planning-csrf": "1",
  },
});
assert.equal(unauthenticatedSuggestionDismiss.status, 401, "suggestion dismiss API should reject unauthenticated requests");

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
let smokeGuestId = "";

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

  const missingExtractionCsrf = await fetch(`${baseUrl}/api/private-planning/files/not-a-file/extract`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({}),
  });
  assert.equal(missingExtractionCsrf.status, 403, "file extraction without CSRF should fail");

  if (!process.env.OPENAI_API_KEY) {
    const extractionWithoutKey = await fetch(`${baseUrl}/api/private-planning/files/not-a-file/extract`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        cookie,
        "x-private-planning-csrf": "1",
      },
      body: JSON.stringify({}),
    });
    assert.equal(extractionWithoutKey.status, 503, "extraction should fail closed without OPENAI_API_KEY");
  }

  const missingSuggestionCsrf = await fetch(`${baseUrl}/api/private-planning/vendor-suggestions/not-a-suggestion/apply`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({ action: "create" }),
  });
  assert.equal(missingSuggestionCsrf.status, 403, "suggestion apply without CSRF should fail");

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

  const missingGuestCsrf = await fetch(`${baseUrl}/api/private-planning/guests`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({ fullName: "Blocked Guest" }),
  });
  assert.equal(missingGuestCsrf.status, 403, "guest creates without the CSRF header should fail");

  const missingGuestImportCsrf = await fetch(`${baseUrl}/api/private-planning/guests/import`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
    },
    body: JSON.stringify({ guests: [{ fullName: "Blocked Import Guest" }] }),
  });
  assert.equal(missingGuestImportCsrf.status, 403, "guest imports without the CSRF header should fail");

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

  const guestList = await fetch(`${baseUrl}/api/private-planning/guests`, {
    headers: { cookie },
  });
  const guestListResult = await readJson(guestList);
  assert.equal(guestList.status, 200, `authenticated guest read should succeed: ${guestListResult.error ?? ""}`);
  assert.ok(Array.isArray(guestListResult.guests), "authenticated guest read should return guests");

  const smokeGuestName = `Private Planning Smoke Guest ${testRunId}`;
  const createGuest = await fetch(`${baseUrl}/api/private-planning/guests`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify({
      fullName: smokeGuestName,
      phoneNumber: "+61400111222",
      email: "smoke@example.test",
      invitedToCeremony: true,
      invitedToReception: true,
      plusOneAllowed: false,
    }),
  });
  const createGuestResult = await readJson(createGuest);
  assert.equal(createGuest.status, 200, `authenticated guest create should succeed: ${createGuestResult.error ?? ""}`);
  smokeGuestId = createGuestResult.guest?.id;
  assert.ok(smokeGuestId, "created smoke guest should include an id");

  const updateGuest = await fetch(`${baseUrl}/api/private-planning/guests`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify({
      id: smokeGuestId,
      side: "Smoke test",
    }),
  });
  const updateGuestResult = await readJson(updateGuest);
  assert.equal(updateGuest.status, 200, `authenticated guest update should succeed: ${updateGuestResult.error ?? ""}`);
  assert.equal(updateGuestResult.guest?.side, "Smoke test", "guest update should persist changed fields");

  const guestExport = await fetch(`${baseUrl}/api/private-planning/guests/export`, {
    headers: { cookie },
  });
  const guestExportText = await guestExport.text();
  assert.equal(guestExport.status, 200, "authenticated guest export should succeed");
  assert.equal(guestExport.headers.get("cache-control"), "no-store", "guest export should not be cached");
  assert.match(guestExportText, new RegExp(smokeGuestName), "guest export should include the smoke guest");

  const deleteGuest = await fetch(`${baseUrl}/api/private-planning/guests`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      origin,
      cookie,
      "x-private-planning-csrf": "1",
    },
    body: JSON.stringify({ id: smokeGuestId }),
  });
  const deleteGuestResult = await readJson(deleteGuest);
  assert.equal(deleteGuest.status, 200, `authenticated guest delete should succeed: ${deleteGuestResult.error ?? ""}`);
  smokeGuestId = "";
} finally {
  if (smokeGuestId) {
    await fetch(`${baseUrl}/api/private-planning/guests`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        origin,
        cookie,
        "x-private-planning-csrf": "1",
      },
      body: JSON.stringify({ id: smokeGuestId }),
    }).catch(() => undefined);
  }
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
