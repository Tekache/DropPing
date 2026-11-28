const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withMainApplication, withDangerousMod, withPlugins } = require('@expo/config-plugins');

const PACKAGE = 'com.webwave.dropping';
const JAVA_DIR = 'android/app/src/main/java/com/webwave/dropping';

const TILE_SERVICE = `package ${PACKAGE};

import android.content.Intent;
import android.graphics.drawable.Icon;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

public class DropPingQuickSettingsTileService extends TileService {
  public static final String PREFS = "dropping_quick_settings";
  public static final String KEY_DISCOVERABLE = "discoverable";

  @Override
  public void onStartListening() {
    super.onStartListening();
    updateTile();
  }

  @Override
  public void onClick() {
    super.onClick();
    boolean next = !getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(KEY_DISCOVERABLE, false);
    getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(KEY_DISCOVERABLE, next).apply();
    updateTile();
    Intent intent = new Intent(this, MainActivity.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    intent.putExtra("dropping_quick_settings_changed", true);
    startActivityAndCollapse(intent);
  }

  private void updateTile() {
    Tile tile = getQsTile();
    if (tile == null) return;
    boolean enabled = getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(KEY_DISCOVERABLE, false);
    tile.setState(enabled ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
    tile.setLabel(enabled ? "DropPing On" : "DropPing");
    tile.setIcon(Icon.createWithResource(this, getApplicationInfo().icon));
    tile.updateTile();
  }
}
`;

const NATIVE_MODULE = `package ${PACKAGE};

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DropPingQuickSettingsModule extends ReactContextBaseJavaModule {
  public DropPingQuickSettingsModule(ReactApplicationContext context) { super(context); }

  @Override
  public String getName() { return "DropPingQuickSettings"; }

  @ReactMethod
  public void getDiscoverable(Promise promise) {
    boolean enabled = getReactApplicationContext()
      .getSharedPreferences(DropPingQuickSettingsTileService.PREFS, 0)
      .getBoolean(DropPingQuickSettingsTileService.KEY_DISCOVERABLE, false);
    promise.resolve(enabled);
  }

  @ReactMethod
  public void setDiscoverable(boolean enabled, Promise promise) {
    getReactApplicationContext()
      .getSharedPreferences(DropPingQuickSettingsTileService.PREFS, 0)
      .edit()
      .putBoolean(DropPingQuickSettingsTileService.KEY_DISCOVERABLE, enabled)
      .apply();
    promise.resolve(null);
  }
}
`;

const NATIVE_PACKAGE = `package ${PACKAGE};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class DropPingQuickSettingsPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new DropPingQuickSettingsModule(context));
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext context) {
    return Collections.emptyList();
  }
}
`;

function withFiles(config) {
  return withDangerousMod(config, ['android', async (config) => {
    const dir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java/com/webwave/dropping');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'DropPingQuickSettingsTileService.java'), TILE_SERVICE);
    fs.writeFileSync(path.join(dir, 'DropPingQuickSettingsModule.java'), NATIVE_MODULE);
    fs.writeFileSync(path.join(dir, 'DropPingQuickSettingsPackage.java'), NATIVE_PACKAGE);
    return config;
  }]);
}

function withManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;
    application.service = application.service || [];
    const name = '.DropPingQuickSettingsTileService';
    if (!application.service.some((service) => service.$?.['android:name'] === name)) {
      application.service.push({
        $: {
          'android:name': name,
          'android:label': 'DropPing',
          'android:icon': '@mipmap/ic_launcher',
          'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } }],
        }],
        'meta-data': [
          { $: { 'android:name': 'android.service.quicksettings.TOGGLEABLE_TILE', 'android:value': 'true' } },
          { $: { 'android:name': 'android.service.quicksettings.SETTINGS_ACTIVITY', 'android:value': `${PACKAGE}.MainActivity` } },
        ],
      });
    }
    return config;
  });
}

function withPackage(config) {
  return withMainApplication(config, (config) => {
    const marker = 'add(DropPingQuickSettingsPackage())';
    if (!config.modResults.contents.includes(marker)) {
      const target = 'PackageList(this).packages.apply {';
      config.modResults.contents = config.modResults.contents.replace(
        target,
        `${target}\n          ${marker}`
      );
    }
    return config;
  });
}

module.exports = function withQuickSettingsTile(config) {
  return withPlugins(config, [withFiles, withManifest, withPackage]);
};
module.exports.withQuickSettingsTile = module.exports;
