import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";

export const DEMO_ORIGIN = "http://127.0.0.1:4322";

// Entirely fictional presentation examples. Topics are curated response fixtures,
// not evidence that the hosted model or production authentication was exercised.
export const demoPeople = [
  {
    name: "Marta Nowak",
    circle: "friend",
    birthday: [11, 21],
    notes: [
      {
        daysAgo: 28,
        text: "Coffee after work. She signed up for her first half marathon in Gdansk next spring. Training three times a week, but the long Sunday runs still feel intimidating. We said we would try a short run together.",
      },
      {
        daysAgo: 12,
        text: "A walk by the river. Her new rescue dog, Pixel, is settling in and finally sleeping through the night. She is looking for a dog-friendly cafe for weekend breakfasts. She also started a beginner pottery class on Thursdays.",
      },
      {
        daysAgo: 2,
        text: "Caught up over lunch. She finished her first 12 km run and sounded really proud. The pottery class is going well: she is making a very uneven blue mug. Suggested a relaxed breakfast next weekend, somewhere Pixel can come too.",
      },
    ],
    topics: [
      {
        text: "First half marathon: a 12 km milestone",
        questions: ["How did you feel after your first 12 km run?", "Would you like company for an easy training run?"],
      },
      {
        text: "Weekend breakfast with Pixel",
        questions: [
          "Have you found a favourite dog-friendly cafe?",
          "Shall we pick somewhere for breakfast next weekend?",
        ],
      },
      {
        text: "Thursday pottery and the blue mug",
        questions: ["How is your blue mug coming along?", "What would you like to make next?"],
      },
    ],
  },
  {
    name: "Piotr Kowalski",
    circle: "family",
    birthday: [12, 8],
    notes: [
      {
        daysAgo: 35,
        text: "Sunday dinner. He is renovating the spare room into a small woodworking workshop. He wants to build a bookshelf from oak, but still needs to decide how to finish the wood. Offered to help with sanding one weekend.",
      },
      {
        daysAgo: 14,
        text: "Phone call on the way home. The workbench is finally assembled. He has booked a long weekend in the Bieszczady mountains and hopes to try landscape photography at sunrise. Asked if I still have the small camera tripod he could borrow.",
      },
      {
        daysAgo: 4,
        text: "Stopped by with coffee. The first bookshelf is finished and already full of books. He is pleased with the natural oil finish. Promised to bring the tripod before his mountain trip; we should find a day for another workshop afternoon.",
      },
    ],
    topics: [
      {
        text: "The first oak bookshelf is finished",
        questions: ["How does the bookshelf look now it is full?", "What is the next workshop project?"],
      },
      {
        text: "Bieszczady trip and sunrise photography",
        questions: ["Which trails are you hoping to explore?", "When should I bring over the tripod?"],
      },
      { text: "Another afternoon in the workshop", questions: ["Would next Saturday work for a workshop afternoon?"] },
    ],
  },
  {
    name: "Anna Zielinska",
    circle: "professional",
    birthday: [3, 16],
    notes: [
      {
        daysAgo: 24,
        text: "Coffee after the project review. She is moving into her first team lead role next month. Excited about mentoring two junior analysts, but unsure how to keep one-to-ones useful. We talked about asking what each person wants to learn.",
      },
      {
        daysAgo: 9,
        text: "Lunch near the office. She is preparing a short internal talk about making dashboards easier to understand. Wants to use one clear before-and-after example instead of ten charts. Offered to listen to a practice run and share the storytelling book we discussed.",
      },
      {
        daysAgo: 1,
        text: "Quick catch-up. Her first team one-to-ones went well, especially the learning-goals question. The dashboard talk is on Friday. She would appreciate a 15-minute rehearsal on Wednesday. Remember to send the book recommendation.",
      },
    ],
    topics: [
      {
        text: "Settling into her first team lead role",
        questions: ["What have you learned from the first one-to-ones?", "How are the junior analysts getting on?"],
      },
      {
        text: "Wednesday rehearsal for the dashboard talk",
        questions: ["What time works for a 15-minute practice run?", "Which before-and-after example did you choose?"],
      },
      {
        text: "Send the storytelling book recommendation",
        questions: ["Would the book we discussed still be useful for your talk?"],
      },
    ],
  },
  {
    name: "Julia Wisniewska",
    circle: "friend",
    birthday: [6, 4],
    notes: [
      {
        daysAgo: 42,
        text: "Video call after a long gap. She has moved to Copenhagen and is still exploring the city by bike. Started learning Danish and laughs that ordering pastries is her main practical exercise. We agreed not to let another six months pass before catching up.",
      },
      {
        daysAgo: 6,
        text: "A proper catch-up at last. She found a weekend cycling group and feels more settled. Planning to visit Poland in December, possibly the second weekend. We talked about meeting for pierogi and exchanging favourite winter recipes.",
      },
    ],
    topics: [
      {
        text: "Feeling at home in Copenhagen",
        questions: ["How is the weekend cycling group?", "What has become your favourite place in the city?"],
      },
      {
        text: "December visit and a pierogi catch-up",
        questions: ["Have you confirmed your December travel dates?", "Shall we reserve an evening for pierogi?"],
      },
      {
        text: "Danish lessons, one pastry at a time",
        questions: ["What is the most useful phrase you have learned so far?"],
      },
    ],
  },
  {
    name: "Tomasz Lewandowski",
    circle: "other",
    birthday: [9, 12],
    notes: [
      {
        daysAgo: 18,
        text: "Chat after the neighbourhood meeting. He is organising a small community garden and looking for people to help plant herbs in spring. He has already built two raised beds from reclaimed wood. Mentioned that a seed-swap afternoon could be a nice way to meet neighbours.",
      },
      {
        daysAgo: 3,
        text: "Met outside the bakery. The community garden now has eight volunteers. He is drawing a simple planting plan and wants to include mint, thyme and tomatoes. I offered to bring spare seed trays and help make a small poster for the seed swap.",
      },
    ],
    topics: [
      {
        text: "Community garden: eight volunteers and a plan",
        questions: ["How is the planting plan taking shape?", "When is the next garden planning session?"],
      },
      { text: "Bring seed trays for the spring planting", questions: ["How many seed trays would be useful?"] },
      {
        text: "Help with the neighbourhood seed-swap poster",
        questions: ["Have you picked a date for the seed swap?", "What details should go on the poster?"],
      },
    ],
  },
];

/** @param {number} daysAgo */
function dateBefore(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** @param {import('@playwright/test').Page} page */
export async function configurePresentationPage(page) {
  // The synthetic session header is added only to this loopback application's requests.
  await page.route(`${DEMO_ORIGIN}/**`, async (route) => {
    if (new URL(route.request().url()).pathname === "/api/extractions/anchors") {
      const rawBody = /** @type {unknown} */ (route.request().postDataJSON());
      const body = /** @type {{note?: string, excludedTopics?: string[]}} */ (rawBody);
      const person = demoPeople.find((candidate) => candidate.notes.some((note) => body.note?.includes(note.text)));
      if (!person) {
        await route.fulfill({ status: 422, json: { error: "No presentation fixture matches these notes." } });
        return;
      }
      const topics = person.topics.filter((topic) => !body.excludedTopics?.includes(topic.text));
      await route.fulfill({ status: 200, json: { topics } });
      return;
    }
    await route.continue({ headers: { ...route.request().headers(), "x-keep-in-touch-e2e-owner": "owner-a" } });
  });
}

/** @param {import('@playwright/test').Page} page */
export async function seedPresentation(page) {
  await page.goto(`${DEMO_ORIGIN}/dashboard`);
  await expect(page.getByRole("heading", { name: "Your people", exact: true })).toBeVisible();
  await expect(page.getByText("Loading your people", { exact: false })).toHaveCount(0);

  for (const person of demoPeople) {
    const existing = page.getByRole("button", { name: new RegExp(person.name) });
    // Wait for React to finish reading IndexedDB before deciding whether to create.
    await expect(
      page
        .getByRole("button", { name: "Save person", exact: true })
        .or(page.getByRole("button", { name: "Add person", exact: true })),
    ).toBeVisible();
    if (await existing.count()) {
      await existing.click();
    } else {
      const addPerson = page.getByRole("button", { name: "Add person", exact: true });
      if (await addPerson.count()) await addPerson.click();
      await page.getByLabel("Name", { exact: true }).fill(person.name);
      await page.getByLabel("Relationship circle").selectOption(person.circle);
      await page.getByLabel("Birthday month").selectOption(String(person.birthday[0]));
      await page.getByLabel("Birthday day").selectOption(String(person.birthday[1]));
      await page.getByRole("button", { name: "Save person", exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: person.name, exact: true })).toBeVisible();
    const interactions = page.getByRole("region", { name: "Interactions", exact: true });
    await expect(interactions.getByRole("status")).toHaveCount(0);
    for (const note of person.notes) {
      if (
        await interactions
          .getByRole("paragraph")
          .and(interactions.getByText(note.text, { exact: true }))
          .count()
      )
        continue;
      await page.getByLabel("Date", { exact: true }).fill(dateBefore(note.daysAgo));
      await page.getByLabel("Note", { exact: true }).fill(note.text);
      await page.getByRole("button", { name: "Save interaction", exact: true }).click();
      await expect(
        interactions.getByRole("paragraph").and(interactions.getByText(note.text, { exact: true })),
      ).toBeVisible();
    }
    await page.getByRole("button", { name: "Generate Core Topics", exact: true }).click();
    for (const topic of person.topics) {
      await expect(page.getByText(topic.text, { exact: true })).toBeVisible();
    }
    console.log(`Presentation ready: ${person.name} (${person.notes.length} notes, ${person.topics.length} topics)`);
  }

  // A real reload proves the app persisted people, notes and generated topics.
  await page.reload();
  for (const person of demoPeople) {
    await page.getByRole("button", { name: new RegExp(person.name) }).click();
    await expect(page.getByRole("heading", { name: person.name, exact: true })).toBeVisible();
    for (const note of person.notes) await expect(page.getByText(note.text, { exact: true })).toBeVisible();
    for (const topic of person.topics) await expect(page.getByText(topic.text, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: /Marta Nowak/ }).click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} directory
 */
export async function capturePresentation(page, directory) {
  await mkdir(directory, { recursive: true });
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /Marta Nowak/ }).click();
  await page.getByText(demoPeople[0].topics[0].text, { exact: true }).click();
  await expect(page.getByText(demoPeople[0].topics[0].questions[0], { exact: true })).toBeVisible();
  await page.evaluate(() => {
    globalThis.scrollTo(0, 0);
  });
  await page.screenshot({ path: `${directory}/01-friend-briefing.png`, fullPage: true });
  await page
    .getByRole("region", { name: "Core Topics", exact: true })
    .screenshot({ path: `${directory}/02-topics-and-questions.png` });
  await page
    .getByRole("region", { name: "Interactions", exact: true })
    .screenshot({ path: `${directory}/03-conversation-history.png` });
  await page.getByRole("button", { name: /Anna Zielinska/ }).click();
  await expect(page.getByText(demoPeople[2].topics[0].text, { exact: true })).toBeVisible();
  await page.getByText(demoPeople[2].topics[1].text, { exact: true }).click();
  await page.evaluate(() => {
    globalThis.scrollTo(0, 0);
  });
  await page.screenshot({ path: `${directory}/04-colleague-follow-ups.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Marta Nowak/ }).click();
  await expect(page.getByRole("heading", { name: "Marta Nowak", exact: true })).toBeVisible();
  await page.evaluate(() => {
    globalThis.scrollTo(0, 0);
  });
  await page.screenshot({ path: `${directory}/05-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByText(demoPeople[0].topics[0].text, { exact: true }).click();
  await page.evaluate(() => {
    globalThis.scrollTo(0, 0);
  });
}
