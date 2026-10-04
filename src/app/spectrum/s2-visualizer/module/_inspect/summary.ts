const summary = {
  initial: {
    graph: {
      // total nodes 163
      nodes: [
        {
          type: ["component", "orphan-category"],
        },
      ],
      adjacencyList: {},
    },
    nodes: [
      {
        type: ["spectrumToken"],
        data: {
          type: ["component", "orphan-category"],
          isSelected: false,
          isSelectionAncestor: false,
          isSelectionDescendent: false,
          isSelectionDescendentIntersect: false,
        },
      },
    ],
    selected: [],
    selectionAncestorNodeIds: [],
    selectionDescendentNodeIds: [],
    selectedChildDescendentNodeIds: [],
    selectionDescendentIntersectNodeIds: [],
  },
  layer1Code: {
    graph: {
      // total nodes 206
      nodes: [
        {
          type: ["component", "orphan-category", "token"],
        },
      ],
      adjacencyList: {
        code: ["code-cjk-size-l", "code-cjk-size-xs", "code-color"],
        "code-cjk-size-l": ["code-size-l"],
        "code-cjk-size-m": ["code-size-m"],
        "code-color": ["gray-800"],
      },
    },
    nodes: [
      {
        type: ["spectrumToken"],
        data: {
          type: ["component", "orphan-category"],
          isSelected: false,
          isSelectionAncestor: false,
          isSelectionDescendent: false,
          isSelectionDescendentIntersect: false,
        },
      },
    ],
    edges: [
      {
        id: "code->code-cjk-emphasized-font-style",
        source: "code",
        target: "code-cjk-emphasized-font-style",
        type: "default",
        zIndex: 0,
        style: {
          stroke: "#e4e4e7",
          strokeWidth: 2,
          opacity: 1,
        },
      },
    ],
    selected: ["code"],
    selectionAncestorNodeIds: [],
    selectionDescendentNodeIds: [
      "code",
      "code-cjk-emphasized-font-style",
      "code-color",
      "gray-800",
      "font-size-400",
      "font-size-75",
    ],
    selectedChildDescendentNodeIds: [],
    selectionDescendentIntersectNodeIds: [],
    focusNodeIds: ["code", "code-cjk-emphasized-font-style", "code-color", "gray-800", "font-size-400", "font-size-75"],
  },
  layer1CodeGray800: {
    graph: {
      // total nodes 244
      nodes: [
        {
          type: ["component", "orphan-category", "token"],
        },
      ],
      adjacencyList: {
        code: ["code-cjk-size-l", "code-cjk-size-xs", "code-color"],
        "code-cjk-size-l": ["code-size-l"],
        "code-cjk-size-m": ["code-size-m"],
        "code-color": ["gray-800"],
        "icon-*": ["icon-color-primary-default"],
        "gray-*": ["gray-800"],
        "body-color": ["gray-800"],
        "neutral-*": ["neutral-background-color-default", "neutral-background-color-selected-default"],
      },
    },
    nodes: [
      {
        type: ["spectrumToken"],
        data: {
          type: ["component", "orphan-category"],
          isSelected: false,
          isSelectionAncestor: false,
          isSelectionDescendent: false,
          isSelectionDescendentIntersect: false,
        },
      },
      {
        id: "code",
        type: "spectrumToken",
        position: {
          x: 0,
          y: 594,
        },
        data: {
          graphNode: {
            type: "component",
            id: "code",
            x: 0,
            y: 594,
          },
          isSelected: true,
          isSelectionAncestor: true,
          isSelectionDescendent: true,
          isSelectionDescendentIntersect: false,
        },
      },
      {
        id: "gray-800",
        type: "spectrumToken",
        position: {
          x: 1950,
          y: 2004.5637931034487,
        },
        data: {
          graphNode: {
            type: "token",
            id: "gray-800",
            x: 1950,
            y: 2004.5637931034487,
            value: "rgb(41, 41, 41):^;light",
          },
          isSelected: true,
          isSelectionAncestor: true,
          isSelectionDescendent: true,
          isSelectionDescendentIntersect: true,
        },
      },
    ],
    edges: [
      {
        id: "code->code-cjk-emphasized-font-style",
        source: "code",
        target: "code-cjk-emphasized-font-style",
        type: "default",
        zIndex: 0,
        style: {
          stroke: "#e4e4e7",
          strokeWidth: 2,
          opacity: 1,
        },
      },
    ],
    selectionAncestorNodeIds: [
      "gray-800",
      "neutral-background-color-default",
      "neutral-content-color-default",
      "code-color",
      "body-color",
      "gray-*",
      "neutral-*",
      "code",
      "body",
      "table",
      "icon",
      "icon-*",
    ],
    selectionDescendentNodeIds: [
      "code",
      "code-cjk-emphasized-font-style",
      "code-cjk-size-xl",
      "code-cjk-size-xs",
      "code-font-weight",
      "default-font-style",
      "bold-font-weight",
      "gray-800",
      "font-size-400",
      "font-size-75",
    ],
    selectedChildDescendentNodeIds: ["gray-800"],
    selectionDescendentIntersectNodeIds: ["gray-800"],
    focusNodeIds: [
      "code",
      "gray-800",
      "code-color",
      "body-color",
      "gray-*",
      "thumbnail",
      "neutral-*",
      "body",
      "table",
      "icon",
      "icon-*",
      "code-cjk-emphasized-font-style",
      "code-size-s",
      "code-size-xl",
      "code-size-xs",
      "code-strong-font-style",
      "code-strong-font-weight",
      "default-font-style",
      "bold-font-weight",
      "regular-font-weight",
      "font-size-75",
    ],
  },
}

const understand = {
  // "component-s-bold", "component-s-medium",
  tokens: [
    "font-size-100",
    "notice-color-400",
    "corner-radius-1000",
    "title-size-s",
    "title-size-m",
    "heading-size-xxs",
    "detail-size-m",
    "code-size-s",
    "body-size-s",
  ],
  components: ["title", "heading", "code"],

  nodes: [
    {
      id: "title",
      type: "component",
    },
    {
      id: "heading",
      type: "component",
    },
    {
      id: "code",
      type: "component",
    },

    {
      id: "title-size-s",
      type: "token",
    },
    {
      id: "title-size-m",
      type: "token",
    },
    {
      id: "title-color",
      type: "token",
    },

    {
      id: "heading-size-xxs",
      type: "token",
    },
    {
      id: "heading-size-xs",
      type: "token",
    },

    {
      id: "code-size-s",
      type: "token",
    },
    {
      id: "code-size-m",
      type: "token",
    },

    {
      id: "font-size-100",
      type: "token",
    },
    {
      id: "font-size-200",
      type: "token",
    },
    {
      id: "font-size-300",
      type: "token",
    },

    {
      id: "gray-900",
      type: "token",
    },
    {
      id: "neutral-background-color-down",
      type: "token",
    },
    {
      id: "neutral-background-color-hover",
      type: "token",
    },
  ],
  relations: [
    {
      from: "title",
      to: "title-size-s",
      type: "assign-token",
    },
    {
      from: "title",
      to: "title-size-m",
      type: "assign-token",
    },
    {
      from: "title-size-s",
      to: "font-size-100",
      type: "value",
    },
    {
      from: "title-size-m",
      to: "font-size-200",
      type: "value",
    },
    {
      from: "title-color",
      to: "gray-900",
      type: "value",
    },

    {
      from: "heading",
      to: "heading-size-xxs",
      type: "assign-token",
    },
    {
      from: "heading",
      to: "heading-size-xs",
      type: "assign-token",
    },
    {
      from: "heading-size-xxs",
      to: "font-size-200",
      type: "value",
    },
    {
      from: "heading-size-xs",
      to: "font-size-300",
      type: "value",
    },

    {
      from: "code",
      to: "code-size-s",
      type: "assign-token",
    },
    {
      from: "code",
      to: "code-size-m",
      type: "assign-token",
    },
    {
      from: "code-size-s",
      to: "font-size-100",
      type: "value",
    },
    {
      from: "code-size-m",
      to: "font-size-200",
      type: "value",
    },

    {
      from: "gray-900",
      to: "rgb(19, 19, 19)",
      type: "value",
    },
    {
      from: "neutral-background-color-down",
      to: "gray-900",
      type: "value",
    },
    {
      from: "neutral-background-color-hover",
      to: "gray-900",
      type: "value",
    }
  ],
}



/*





 */