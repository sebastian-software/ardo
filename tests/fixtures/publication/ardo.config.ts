import { defineArdoConfig } from "ardo/config"

export default defineArdoConfig({
  title: "Publication example",
  base: "/project/",
  siteUrl: "https://example.test",
  linkCheck: { level: "error" },
  versioning: {
    current: "v2",
    versions: [
      { id: "v2", path: "/v2/" },
      { id: "v1", path: "/v1/" },
    ],
    directories: ["guide"],
  },
  publication: {
    from: "posts",
    name: "Field notes",
    description: "Thoughtful updates on design, engineering, and the work in between.",
    authors: {
      alex: {
        name: "Alex Morgan",
        title: "Design engineer",
        description: "Writing about readable interfaces and the details that make them work.",
        did: "did:plc:examplealex",
      },
      sam: {
        name: "Sam Rivera",
        title: "Software engineer",
        url: "https://people.example.test/sam",
      },
    },
  },
})
