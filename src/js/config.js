// **************************************
// * DON'T MODIFY THIS FILE!!!
// * USE "appConfig.json" INSTEAD
// **************************************

// default values (don't modify!)
let appConfig = {
  production: true,
  debugOnDesktop: false,
  debugLoadMode: false,
  debugUserId: null,
  debugMarkerId: null
};


export async function loadConfig() {
  try {
    const response = await fetch('./appConfig.json');
    const externalConfig = await response.json();
    appConfig = { ...appConfig, ...externalConfig };
  } catch (error) {
    console.error('Failed to load config, using defaults', error);
  }
}

export const config = {
  get production() {
    return appConfig.production;
  },
  get debugOnDesktop() {
    return appConfig.debugOnDesktop;
  },
  get debugLoadMode() {
    return appConfig.debugLoadMode;
  },
   get debugUserId() {
    return appConfig.debugUserId;
  },
   get debugMarkerId() {
    return appConfig.debugMarkerId;
  },
};