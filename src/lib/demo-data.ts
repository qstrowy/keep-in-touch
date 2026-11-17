import { createInteractionRecord, localDateString } from "@/lib/interactions/interaction";
import { createPersonRecord, PEOPLE_COLLECTION, type RelationshipCircle } from "@/lib/people/person";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";

const demoPeople: DemoPerson[] = [
  {
    id: "demo-marta-kowalska",
    displayName: "Marta Kowalska",
    relationshipCircle: "friend",
    birthday: { month: 4, day: 18 },
    interactions: [
      { daysAgo: 2, note: "Her big interview is next Thursday. She feels prepared, but the panel format is new." },
      { daysAgo: 11, note: "The puppy is called Olive. She adopted her from a local shelter last month." },
      { daysAgo: 29, note: "Training for her first half-marathon, one long run at a time." },
    ],
  },
  {
    id: "demo-adam-nowak",
    displayName: "Adam Nowak",
    relationshipCircle: "professional",
    interactions: [
      { daysAgo: 4, note: "His team moved into the new office this week. Ask how the commute is going." },
      { daysAgo: 16, note: "Prefers tea, no sugar, before the morning planning meeting." },
    ],
  },
  {
    id: "demo-zofia-wisniewska",
    displayName: "Zofia Wiśniewska",
    relationshipCircle: "family",
    birthday: { month: 8, day: 7 },
    interactions: [
      { daysAgo: 1, note: "Planning a balcony garden with tomatoes and fresh herbs." },
      { daysAgo: 13, note: "Visiting her sister this weekend and bringing the lemon cake recipe." },
    ],
  },
  {
    id: "demo-leo-martins",
    displayName: "Leo Martins",
    relationshipCircle: "friend",
    interactions: [
      { daysAgo: 6, note: "Started guitar lessons and is practicing a little every evening." },
      { daysAgo: 21, note: "Thinking about a train trip to the coast in spring." },
    ],
  },
  {
    id: "demo-aisha-rahman",
    displayName: "Aisha Rahman",
    relationshipCircle: "professional",
    birthday: { month: 11, day: 22 },
    interactions: [
      { daysAgo: 3, note: "Speaking at the design meetup next month. Excited, but a little nervous." },
      { daysAgo: 18, note: "Joined a mentoring circle and is enjoying getting to know the new team." },
    ],
  },
  {
    id: "demo-nina-patel",
    displayName: "Nina Patel",
    relationshipCircle: "other",
    interactions: [
      { daysAgo: 5, note: "Her dog Pesto hates the rain, so they take their walks early on dry mornings." },
      { daysAgo: 24, note: "Offering extra seedlings for the community garden." },
    ],
  },
];

interface DemoPerson {
  id: string;
  displayName: string;
  relationshipCircle: RelationshipCircle;
  birthday?: { month: number; day: number };
  interactions: { daysAgo: number; note: string }[];
}

export async function seedDemoData(ownerId: string): Promise<number> {
  const vault = createRelationshipVault(ownerId);
  const existingPeople = await vault.listByCollection(PEOPLE_COLLECTION);
  if (existingPeople.length > 0) {
    return 0;
  }

  let interactionCount = 0;
  for (const [personIndex, person] of demoPeople.entries()) {
    const personId = person.id;
    await vault.put(
      createPersonRecord(
        {
          displayName: person.displayName,
          relationshipCircle: person.relationshipCircle,
          ...(person.birthday ? { birthday: person.birthday } : {}),
        },
        personId,
      ),
    );

    for (const [interactionIndex, interaction] of person.interactions.entries()) {
      const occurredAt = new Date();
      occurredAt.setDate(occurredAt.getDate() - interaction.daysAgo);
      occurredAt.setHours(12, 0, 0, 0);
      const occurredOn = localDateString(occurredAt);
      const id = `demo-interaction-${personIndex + 1}-${interactionIndex + 1}`;

      await vault.put(
        createInteractionRecord({ occurredOn, note: interaction.note }, id, personId, occurredAt.getTime()),
      );
      interactionCount += 1;
    }
  }

  return interactionCount;
}
