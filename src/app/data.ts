export const courseEditorConfig = {
  context: {
    identifier: "do_214238080073170944126",
    channel: "scp-channel",
    authToken: "",
    sid: "wEWyS7CAtC8H6cZ2uzSGpYzgzPQOAG7d",
    did: "41979218feacef84d1faa35f7fb5128f",
    uid: "15155b7a-5316-4bb2-992a-772093e85f44",
    additionalCategories: {},
    host: "",
    pdata: {
      id: "test.portal",
      ver: "1.0.0",
      pid: "collection-portal",
    },
    actor: {
      id: "15155b7a-5316-4bb2-992a-772093e85f44",
      type: "User",
    },
    contextRollup: {
      l1: "scp-channel",
    },
    tags: ["scp-channel", "scp-channel"],
    timeDiff: -0.037,
    endpoint: "/data/v3/telemetry",
    env: "collection_editor",
    user: {
      id: "15155b7a-5316-4bb2-992a-772093e85f44",
      orgIds: ["scp-channel"],
      organisations: {},
      fullName: "Test",
      firstName: "Test User",
      lastName: "User",
      isRootOrgAdmin: false,
    },
    channelData: {},
    cloudStorageUrls: [
      "https://knowlg-public.s3.ap-south-1.amazonaws.com/",
    ],
    cloudStorage: {
      provider: "aws",
    },
    framework: "level1-framework",
    targetFWIds: ["scp-framework"],
  },
  config: {
    primaryCategory: "Course",
    objectType: "Collection",
    mode: "edit",
    userSpecificFrameworkField: {
      code: "board",
      value: ["Karnataka State Education Board"]
    },
    questionSet: {
      maxQuestionsLimit: 500,
    },
    collection: {
      maxContentsLimit: 1200,
    },
    showAddCollaborator: true,
    publicStorageAccount:
      "https://knowlg-public.s3.ap-south-1.amazonaws.com/",
    maxDepth: 4,
    isRoot: true,
    iconClass: "fa fa-book",
    children: {},
    hierarchy: {
      level1: {
        name: "Course Unit",
        type: "Unit",
        mimeType: "application/vnd.ekstep.content-collection",
        contentType: "CourseUnit",
        primaryCategory: "Course Unit",
        iconClass: "fa fa-folder-o",
        children: {
          Content: [],
        },
      },
      level2: {
        name: "Course Unit",
        type: "Unit",
        mimeType: "application/vnd.ekstep.content-collection",
        contentType: "CourseUnit",
        primaryCategory: "Course Unit",
        iconClass: "fa fa-folder-o",
        children: {
          Content: [],
        },
      },
      level3: {
        name: "Course Unit",
        type: "Unit",
        mimeType: "application/vnd.ekstep.content-collection",
        contentType: "CourseUnit",
        primaryCategory: "Course Unit",
        iconClass: "fa fa-folder-o",
        children: {
          Content: [],
        },
      },
      level4: {
        name: "Course Unit",
        type: "Unit",
        mimeType: "application/vnd.ekstep.content-collection",
        contentType: "CourseUnit",
        primaryCategory: "Course Unit",
        iconClass: "fa fa-folder-o",
        children: {
          Content: [],
        },
      },
    },
  },
};

export const questionSetEditorConfig = {};
export const questionEditorConfig = {};
export const collectionEditorConfig = {};
export const observationEditorConfig = {};
export const surveyEditorConfig = {};
export const observationRubricsEditorConfig = {};
