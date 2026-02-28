const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all workspace files so @repo/* packages resolve correctly
config.watchFolders = [monorepoRoot];

// 2. Resolve node_modules: app-local first, monorepo root as fallback
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force ALL "react" and "react/*" imports to resolve from THIS app's node_modules,
//    no matter which package triggers the import.
//
//    Background: pnpm hoists the web app's react@19.2.4 to root node_modules/react.
//    Packages inside root node_modules (react-native, reanimated, etc.) resolve "react"
//    from the root → 19.2.4. App code resolves from apps/mobile/node_modules → 19.1.4.
//    Two React copies in one bundle = null dispatcher = "useId of null" crash.
//
//    extraNodeModules is only a fallback (used when Metro can't resolve normally),
//    so it doesn't fix this. resolveRequest intercepts every resolution unconditionally.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.startsWith("react/")) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
