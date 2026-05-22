import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  collectApiNamesFromConfig,
  readReact33OpenApiConfig,
  type OpenApiFileConfig,
} from './openapi/config-types.js';
import { generateOpenApiBundle } from './openapi/generate-openapi.js';
import { deriveHooksGeneratedPath } from './generate-react33-apis.js';

export { readReact33OpenApiConfig, collectApiNamesFromConfig };
export { generateOpenApiBundle } from './openapi/generate-openapi.js';

export async function writeOpenApiBundles(
  configJson: unknown,
  configDir: string,
  apisGeneratedPath: string,
): Promise<void> {
  const openApi = readReact33OpenApiConfig(configJson);
  if (!openApi) return;

  const apiNames = collectApiNamesFromConfig(configJson);
  const hooksPath = deriveHooksGeneratedPath(apisGeneratedPath);

  for (const [bundleKey, fileConfig] of Object.entries(openApi.files)) {
    validateFileConfig(fileConfig, apiNames, bundleKey);

    const specPath = resolve(configDir, fileConfig.specSource);
    const zodPath = resolve(configDir, fileConfig.zodOutput);
    const typesPath = resolve(configDir, fileConfig.typesOutput);
    const sdkPath = resolve(configDir, fileConfig.sdkOutput);
    const hooksOutPath = resolve(configDir, fileConfig.hooksOutput);
    const initDataPath = fileConfig.initData?.source
      ? resolve(configDir, fileConfig.initData.source)
      : undefined;

    const outputs = await generateOpenApiBundle(specPath, fileConfig, {
      zod: zodPath,
      types: typesPath,
      sdk: sdkPath,
      hooks: hooksOutPath,
      initData: initDataPath,
      apis: apisGeneratedPath,
      apisHooks: hooksPath,
    });

    mkdirSync(dirname(zodPath), { recursive: true });
    writeFileSync(zodPath, outputs.zodSource, 'utf8');
    writeFileSync(typesPath, outputs.typesSource, 'utf8');
    writeFileSync(sdkPath, outputs.sdkSource, 'utf8');
    writeFileSync(hooksOutPath, outputs.hooksSource, 'utf8');

    if (outputs.initDataSource && initDataPath) {
      mkdirSync(dirname(initDataPath), { recursive: true });
      writeFileSync(initDataPath, outputs.initDataSource, 'utf8');
    }

    console.log(`react-networking-generate: wrote OpenAPI bundle (${bundleKey})`);
    console.log(`  ${zodPath}`);
    console.log(`  ${typesPath}`);
    console.log(`  ${sdkPath}`);
    console.log(`  ${hooksOutPath}`);
    if (outputs.initDataSource && initDataPath) {
      console.log(`  ${initDataPath}`);
    }
  }
}

function validateFileConfig(fileConfig: OpenApiFileConfig, apiNames: string[], bundleKey: string): void {
  if (!apiNames.includes(fileConfig.scope)) {
    throw new Error(
      `react33.config.json: openApi.files.${bundleKey}.scope "${fileConfig.scope}" must exist in react33Networking.apis or be derivable from the OpenAPI spec (servers[0].url + basePath)`,
    );
  }
  if (!fileConfig.zodOutput || !fileConfig.typesOutput || !fileConfig.sdkOutput || !fileConfig.hooksOutput) {
    throw new Error(`openApi.files.${bundleKey}: typesOutput, zodOutput, sdkOutput, hooksOutput are required`);
  }
}
