"use strict";

const path = require("path");

const ADMIN_COMPOSABLE_IMPORT_PATTERNS = [
  "~/composables/admin/",
  "@/composables/admin/",
  "~~/composables/admin/",
  "@@/composables/admin/",
  "/composables/admin/",
];

const ALLOWED_PATH_SEGMENTS = [
  "/src/pages/admin/",
  "/src/components/admin/",
  "/src/components/pages/admin/",
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isAdminComposableImport(importPath) {
  return ADMIN_COMPOSABLE_IMPORT_PATTERNS.some((pattern) =>
    importPath.includes(pattern),
  );
}

function isAllowedConsumerFile(filename) {
  const normalized = normalizePath(filename);
  return ALLOWED_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow importing admin composables outside admin pages/components",
      recommended: false,
    },
    schema: [],
    messages: {
      restrictedImport: `Composable '{{importPath}}' can only be used inside the following paths: ${ALLOWED_PATH_SEGMENTS.map((path) => path.replace("/src", "")).join(", ")}`,
    },
  },

  create(context) {
    const filename = context.getFilename();

    if (isAllowedConsumerFile(filename)) {
      return {};
    }

    function checkImportLiteral(node, rawValue) {
      if (typeof rawValue !== "string") {
        return;
      }

      if (!isAdminComposableImport(rawValue)) {
        return;
      }

      context.report({
        node,
        messageId: "restrictedImport",
        data: { importPath: rawValue },
      });
    }

    return {
      ImportDeclaration(node) {
        checkImportLiteral(node.source, node.source && node.source.value);
      },
      ImportExpression(node) {
        if (node.source && node.source.type === "Literal") {
          checkImportLiteral(node.source, node.source.value);
        }
      },
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments &&
          node.arguments[0] &&
          node.arguments[0].type === "Literal"
        ) {
          checkImportLiteral(node.arguments[0], node.arguments[0].value);
        }
      },
    };
  },
};
