// common plugins
import type resolve from "@rollup/plugin-node-resolve"
import type commonjs from "@rollup/plugin-commonjs"
import type { terser } from "rollup-plugin-terser"
import type sourcemaps from "rollup-plugin-sourcemaps"
import type replace from "@rollup/plugin-replace"
// @ts-ignore
import type autoExternal from "rollup-plugin-auto-external"

import type typescript from "@rollup/plugin-typescript"
import type coffeescript from "rollup-plugin-coffee-script"
import type json from "@rollup/plugin-json"
import type cssOnly from "rollup-plugin-css-only"
import type babel from "@rollup/plugin-babel"
import type { wasm } from "@rollup/plugin-wasm"
import type { asc } from "rollup-plugin-assemblyscript"

export type Plugin =
  | "js"
  | "ts"
  | "coffee"
  | "json"
  | "css"
  | "babel"
  | "wasm"
  | "as"
  | "terser"
  | "replace"
  | ["ts", typeof typescript]
  | ["babel", typeof babel]
  | ["coffee", typeof coffeescript]
  | ["json", typeof json]
  | ["css", typeof cssOnly]
  | ["wasm", typeof wasm]
  | ["as", typeof asc]
  | ["terser", typeof terser]
  | ["replace", typeof replace]

// function to check if the first array has any of the second array
// first array can have `[string, object]` as their input
function includesAny(arr1: Array<string | [string, Object]>, arr2: Array<string>): null | number {
  for (let index = 0; index < arr1.length; index++) {
    const elm = arr1[index]
    let name: string
    if (typeof elm === "string") {
      // plugin name only
      name = elm
    } else {
      // plugin with options
      name = elm[0]
    }
    if (arr2.includes(name)) {
      return index
    }
  }
  return null
}

export function createPlugins(
  inputPluginsNames: Array<Plugin> = ["ts", "js", "json", "coffee"],
  extraPlugins?: Array<any> | boolean,
  extraPluginsDeprecated?: Array<any>
) {
  let plugins = []

  // language specific

  // typescript
  const tsIndex = includesAny(inputPluginsNames, ["ts", ".ts", "typescript", "TypeScript"])
  if (tsIndex !== null) {
    const typescript = require("@rollup/plugin-typescript")
    if (typeof inputPluginsNames[tsIndex] === "string") {
      // plugin name only
      plugins.push(
        typescript({
          noEmitOnError: false,
          module: "ESNext", // do not modify the imports
        })
      )
    } else {
      // plugin with options
      plugins.push(typescript(inputPluginsNames[tsIndex][1]))
    }
  }

  // coffeescript
  const coffeeIndex = includesAny(inputPluginsNames, [
    "coffee",
    ".coffee",
    "coffeescript",
    "coffee-script",
    "CoffeeScript",
    "cs",
  ])
  if (coffeeIndex !== null) {
    const coffeescript = require("rollup-plugin-coffee-script")
    if (typeof inputPluginsNames[coffeeIndex] === "string") {
      // plugin name only
      plugins.push(coffeescript())
    } else {
      // plugin with options
      plugins.push(coffeescript(inputPluginsNames[coffeeIndex][1]))
    }
  }

  // json
  const jsonIndex = includesAny(inputPluginsNames, ["json", ".json", "JSON"])
  if (jsonIndex !== null) {
    const json = require("@rollup/plugin-json")
    if (typeof inputPluginsNames[jsonIndex] === "string") {
      // plugin name only
      plugins.push(json({ compact: true }))
    } else {
      // plugin with options
      plugins.push(json(inputPluginsNames[jsonIndex][1]))
    }
  }

  // css only
  const cssIndex = includesAny(inputPluginsNames, ["css", ".css"])
  if (cssIndex !== null) {
    const cssOnly = require("rollup-plugin-css-only")
    console.log(`
      css only was chosen to bundle css files into a single file.
      This plugin requires you to import css files in a dummy js file and pass it as an input to rollup.
      This should be done in a separate step from src code bundling
    `)
    if (typeof inputPluginsNames[cssIndex] === "string") {
      // plugin name only
      plugins.push(cssOnly({ output: "dist/bundle.css" }))
    } else {
      // plugin with options
      plugins.push(cssOnly(inputPluginsNames[cssIndex][1]))
    }
    // minify css
    if (process.env.NODE_ENV === "production") {
      // TODO get the output from the plugin when the user uses options
      const execute = require("rollup-plugin-execute")
      plugins.push(execute(["csso dist/bundle.css --output dist/bundle.css"]))
    }
  }

  // babel
  let babelInput = extraPlugins
  if (typeof babelInput === "boolean") {
    console.warn(
      'Setting babel with the second argument is depcrated. Pass "babel" like other plugins to the first argument'
    )
  }

  const babelIndex = includesAny(inputPluginsNames, ["babel"])
  if (babelIndex !== null || babelInput === true) {
    const { babel } = require("@rollup/plugin-babel")
    if (babelInput === true || typeof inputPluginsNames[babelIndex!] === "string") {
      // plugin name only
      plugins.push(
        babel({
          extensions: [".js", ".jsx", ".mjs", ".coffee"],
          babelHelpers: "bundled",
        })
      )
    } else {
      // plugin with options
      plugins.push(babel(inputPluginsNames[babelIndex!][1]))
    }
  }

  // wasm
  const wasmIndex = includesAny(inputPluginsNames, ["wasm", "WebAssembly"])
  if (wasmIndex !== null) {
    const wasm = require("@rollup/plugin-wasm")
    if (typeof inputPluginsNames[wasmIndex] === "string") {
      // plugin name only
      plugins.push(wasm())
    } else {
      // plugin with options
      plugins.push(wasm(inputPluginsNames[wasmIndex][1]))
    }
  }

  // as
  const ascIndex = includesAny(inputPluginsNames, ["as", "asc", "assemblyscript", "AssemblyScript"])
  if (ascIndex !== null) {
    const { asc } = require("rollup-plugin-assemblyscript")
    if (typeof inputPluginsNames[ascIndex] === "string") {
      // plugin name only
      plugins.push(asc())
    } else {
      // plugin with options
      plugins.push(asc(inputPluginsNames[ascIndex][1]))
    }
  }

  // visualizer
  const visualizerIndex = includesAny(inputPluginsNames, ["visualizer", "plot"])
  if (visualizerIndex !== null) {
    const visualizer = require("rollup-plugin-visualizer")
    if (typeof inputPluginsNames[visualizerIndex] === "string") {
      // plugin name only
      plugins.push(visualizer({sourcemap: true, open: true}))
    } else {
      // plugin with options
      plugins.push(visualizer(inputPluginsNames[visualizerIndex][1]))
    }
  }

  // extra plugins
  if (typeof extraPlugins !== "boolean" && extraPlugins !== undefined) {
    try {
      plugins.push(...extraPlugins)
    } catch (e) {
      console.error("You should pass extraPlugins as an array")
    }
  }

  if (extraPluginsDeprecated) {
    try {
      plugins.push(...extraPluginsDeprecated)
    } catch (e) {
      console.error("You should pass extraPluginsDeprecated as an array")
    }
  }

  let pluginsCommon = [
    // loading files with existing source maps
    sourcemaps(),

    autoExternal({
      builtins: true,
      dependencies: false,
      peerDependencies: false,
    }),

    // so Rollup can find externals
    resolve({
      mainFields: ['module', 'exports', 'es', 'es6', 'esm', 'main'],
      extensions: [".ts", ".js", ".coffee", ".tsx", ".jsx", ".mjs", ".node", ".json"],
      preferBuiltins: true,
      dedupe: [],
    }),

    // so Rollup can convert externals to an ES module
    commonjs({
      transformMixedEsModules: true
    }),
  ]

  plugins.push(...pluginsCommon)

  // replace
  const replaceIndex = includesAny(inputPluginsNames, ["replace"])
  if (replaceIndex !== null && typeof inputPluginsNames[replaceIndex] === "string") {
    // plugin with options
    plugins.push(replace(inputPluginsNames[replaceIndex][1]))
  } else {
    if (process.env.NODE_ENV === "production") {
      plugins.push(
        // set NODE_ENV to production
        replace({
          'process.env.NODE_ENV':JSON.stringify('production'),
        }),
      )
    }
  }

  // terser
  const terserIndex = includesAny(inputPluginsNames, ["terser"])
  if (terserIndex !== null && typeof inputPluginsNames[terserIndex] === "string") {
    // plugin with options
    plugins.push(terser(inputPluginsNames[terserIndex][1]))
  } else {
    if (process.env.NODE_ENV === "production") {
      plugins.push(
        // minify
        terser({
          ecma: 2018,
          warnings: true,
          compress: {
            drop_console: false,
          },
        }),
      )

  // utility function that pushes a plugin
  function pushPlugin(
    nameTriggers: string[],
    [moduleName, prop]: [modulesname: string, prop?: string],
    pluginDefaultOptions: object = {},
    includeByDefault: boolean = false
  ) {
    const index = includesAny(inputPluginsNames, [...nameTriggers, moduleName])
    if (index !== null) {
      const modul = require(moduleName)
      const pluginFunction = typeof prop === "string" ? modul[prop] : modul
      if (typeof inputPluginsNames[index] === "string") {
        // plugin name only
        plugins.push(pluginFunction(pluginDefaultOptions))
      } else {
        // plugin with options
        plugins.push(pluginFunction(inputPluginsNames[index][1]))
      }
    } else if (includeByDefault) {
      const modul = require(moduleName)
      const pluginFunction = typeof prop === "string" ? modul[prop] : modul
      plugins.push(pluginFunction(pluginDefaultOptions))
    }
  }

  return plugins
}

export function createConfig(
  input: string | Array<string> = "src/main.ts",
  output_dir: string = "dist",
  output_format = "cjs",
  externals: Array<string> = ["atom", "electron"],
  plugins = createPlugins()
) {
  return {
    input: input,
    output: [
      {
        dir: output_dir,
        format: output_format,
        sourcemap: true,
      },
    ],
    // loaded externally
    external: externals,
    plugins: plugins,
  }
}
