import prisma from "../lib/prisma";

async function main() {
  await prisma.guest.deleteMany({
    where: {
      OR: [
        { inviteToken: { in: ["TESTADITYA", "TESTSUMAYA"] } },
        { rsvpToken: { in: ["TESTADITYA", "TESTSUMAYA"] } },
      ],
    },
  });

  const guests = await prisma.guest.createManyAndReturn({
    data: [
      {
        fullName: "Aditya Test",
        phoneNumber: "0400000000",
        email: "aditya.test@example.com",
        side: "Groom",
        inviteToken: "TESTADITYA",
        rsvpToken: "TESTADITYA",
        invitedToCeremony: true,
        invitedToReception: true,
        plusOneAllowed: true,
      },
      {
        fullName: "Sumaya Test",
        phoneNumber: "0400000001",
        email: "sumaya.test@example.com",
        side: "Bride",
        inviteToken: "TESTSUMAYA",
        rsvpToken: "TESTSUMAYA",
        invitedToCeremony: true,
        invitedToReception: true,
        plusOneAllowed: true,
      },
    ],
  });

  console.log("Seeded guests:");
  console.log(JSON.stringify(guests, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
