export interface Hook {
    unregister: () => void;
}

interface Apps {
    AddShortcut: any;
    AddUserTagToApps: any;
    BackupFilesForApp: any;
    BrowseLocalFilesForApp: any;
    BrowseScreenshotForApp: any;
    BrowseScreenshotsForApp: any;
    CancelGameAction: any;
    CancelLaunch: any;
    ClearAndSetUserTagsOnApp: any;
    ClearCustomArtworkForApp: any;
    ClearCustomLogoPositionForApp: any;
    ClearProton: any;
    ClearUserTagsOnApps: any;
    ContinueGameAction: any;
    CreateDesktopShortcutForApp: any;
    DeleteLocalScreenshot: any;
    DownloadWorkshopItem: any;
    FetchMarketingMessages: any;
    GetAchievementsInTimeRange: any;
    GetActiveGameActions: any;
    GetAllShortcuts: () => Promise<SteamShortcut[]>;
    GetAvailableCompatTools: any;
    GetCachedAppDetails: any;
    GetCloudPendingRemoteOperations: any;
    GetConflictingFileTimestamps: any;
    GetDetailsForScreenshotUpload: any;
    GetDownloadedWorkshopItems: any;
    GetFriendAchievementsForApp: any;
    GetFriendsWhoPlay: any;
    GetGameActionDetails: any;
    GetGameActionForApp: any;
    GetLaunchOptionsForApp: any;
    GetLibraryBootstrapData: any;
    GetMyAchievementsForApp: any;
    GetResolutionOverrideForApp: any;
    GetScreenshotsInTimeRange: any;
    GetShortcutData: any;
    GetSoundtrackDetails: any;
    GetStoreTagLocalization: any;
    GetSubscribedWorkshopItems: any;
    InstallApp: any;
    InstallFlatpakAppAndCreateShortcut: any;
    JoinAppContentBeta: any;
    JoinAppContentBetaByPassword: any;
    ListFlatpakApps: any;
    LoadEula: any;
    MarkEulaAccepted: any;
    MarkEulaRejected: any;
    MarkMarketingMessageSeen: any;
    PromptToChangeShortcut: any;
    PromptToSelectShortcutIcon: any;
    RegisterForAchievementChanges: any;
    RegisterForAppDetails: any;
    RegisterForAppOverviewChanges: (e: (e: ArrayBuffer) => void) => Hook;
    RegisterForLocalizationChanges: any;
    RegisterForMarketingMessages: any;
    RegisterForWorkshopChanges: any;
    RegisterForWorkshopItemDownloads: any;
    RemoveShortcut: any;
    RemoveUserTagFromApps: any;
    ReportLibraryAssetCacheMiss: any;
    ReportMarketingMessageSeen: any;
    RequestIconDataForApp: any;
    RequestLegacyCDKeysForApp: any;
    ResetHiddenState: any;
    RunGame: any;
    SaveAchievementProgressCache: any;
    ScanForShortcuts: any;
    SetAppAutoUpdateBehavior: any;
    SetAppBackgroundDownloadsBehavior: any;
    SetAppCurrentLanguage: any;
    SetAppHidden: any;
    SetAppLaunchOptions: any;
    SetAppResolutionOverride: any;
    SetCachedAppDetails: any;
    SetControllerRumblePreference: any;
    SetCustomArtworkForApp: any;
    SetCustomLogoPositionForApp: any;
    SetDLCEnabled: any;
    SetLocalScreenshotCaption: any;
    SetLocalScreenshotSpoiler: any;
    SetShortcutExe: any;
    SetShortcutIsVR: any;
    SetShortcutLaunchOptions: any;
    SetShortcutName: any;
    SetShortcutStartDir: any;
    SetStreamingClientForApp: any;
    SetThirdPartyControllerConfiguration: any;
    ShowControllerConfigurator: any;
    ShowStore: any;
    SkipShaderProcessing: any;
    SpecifyCompatTool: any;
    StreamGame: any;
    SubscribeWorkshopItem: any;
    TerminateApp: any;
    ToggleAllowDesktopConfiguration: any;
    ToggleAppFamilyBlockedState: any;
    ToggleAppSteamCloudEnabled: any;
    ToggleAppSteamCloudSyncOnSuspendEnabled: any;
    ToggleEnableDesktopTheatreForApp: any;
    ToggleEnableSteamOverlayForApp: any;
    ToggleOverrideResolutionForInternalDisplay: any;
    UninstallApps: any;
    UninstallFlatpakApp: any;
    UploadLocalScreenshot: any;
    VerifyApp: any;
    VerifyFilesForApp: any;
    RegisterForGameActionStart: (
        e: (actionType: number, id: string, action: string) => void
    ) => Hook;
    RegisterForGameActionEnd: (e: (actionType: number, id: string, action: string) => void) => Hook;
    RegisterForGameActionTaskChange: any;
    RegisterForGameActionUserRequest: any;
    RegisterForGameActionShowError: any;
    RegisterForGameActionShowUI: (e: (e: string) => void) => Hook;
    OpenAppSettingsDialog: any;
}

interface Window {
    BringToFront: any;
    FlashWindow: any;
    GamescopeBlur: any;
    GetBrowserID: any;
    GetMousePositionDetails: any;
    GetWindowDimensions: any;
    GetWindowRestoreDetails: any;
    HideWindow: any;
    IsWindowMinimized: any;
    Minimize: any;
    MoveTo: any;
    PositionWindowRelative: any;
    ProcessShuttingDown: any;
    RegisterForExternalDisplayChanged: any;
    ResizeTo: any;
    SetAutoDisplayScale: any;
    SetComposition: any;
    SetForegroundWindow: any;
    SetKeyFocus: any;
    SetManualDisplayScaleFactor: any;
    SetMinSize: any;
    SetResizeGrip: any;
    SetWindowIcon: any;
    ShowWindow: any;
    StopFlashWindow: any;
    ToggleMaximize: any;
}

export interface SteamClient {
    Apps: Apps;
    Browser: any;
    BrowserView: any;
    ClientNotifications: any;
    Cloud: any;
    Console: any;
    Downloads: any;
    FamilySharing: any;
    FriendSettings: any;
    Friends: any;
    GameSessions: any;
    Input: any;
    InstallFolder: any;
    Installs: any;
    MachineStorage: any;
    Messaging: any;
    Notifications: any;
    OpenVR: any;
    Overlay: any;
    Parental: any;
    RegisterIFrameNavigatedCallback: any;
    RemotePlay: any;
    RoamingStorage: any;
    Screenshots: any;
    Settings: any;
    SharedConnection: any;
    Stats: any;
    Storage: any;
    Streaming: any;
    System: any;
    UI: any;
    URL: any;
    Updates: any;
    User: any;
    WebChat: any;
    Window: Window;
}

export interface SteamShortcut {
    appid: number;
    data: {
        bIsApplication: boolean;
        strAppName: string;
        strExePath: string;
        strArguments: string;
        strShortcutPath: string;
        strSortAs: string;
    };
}
export interface AppAchievement {
    strID: string;
    strName: string;
    strDescription: string;
    bAchieved: boolean;
    rtUnlocked: number;
    strImage: string;
    bHidden: boolean;
    flMinProgress: number;
    flCurrentProgress: number;
    flMaxProgress: number;
    flAchieved: number;
}

export interface AppAchievements {
    nAchieved: number;
    nTotal: number;
    vecAchievedHidden: AppAchievement[];
    vecHighlight: AppAchievement[];
    vecUnachieved: AppAchievement[];
}

export interface AppLanguages {
    strDisplayName: string;
    strShortName: string;
}

export interface AppDetails {
    achievements: AppAchievements;
    bCanMoveInstallFolder: boolean;
    bCloudAvailable: boolean;
    bCloudEnabledForAccount: boolean;
    bCloudEnabledForApp: boolean;
    bCloudSyncOnSuspendAvailable: boolean;
    bCloudSyncOnSuspendEnabled: boolean;
    bCommunityMarketPresence: boolean;
    bEnableAllowDesktopConfiguration: boolean;
    bFreeRemovableLicense: boolean;
    bHasAllLegacyCDKeys: boolean;
    bHasAnyLocalContent: boolean;
    bHasLockedPrivateBetas: boolean;
    bIsExcludedFromSharing: boolean;
    bIsSubscribedTo: boolean;
    bOverlayEnabled: boolean;
    bOverrideInternalResolution: boolean;
    bRequiresLegacyCDKey: boolean;
    bShortcutIsVR: boolean;
    bShowCDKeyInMenus: boolean;
    bShowControllerConfig: boolean;
    bSupportsCDKeyCopyToClipboard: boolean;
    bVRGameTheatreEnabled: boolean;
    bWorkshopVisible: boolean;
    eAppOwnershipFlags: number;
    eAutoUpdateValue: number;
    eBackgroundDownloads: number;
    eCloudSync: number;
    eControllerRumblePreference: number;
    eDisplayStatus: number;
    eEnableThirdPartyControllerConfiguration: number;
    eSteamInputControllerMask: number;
    iInstallFolder: number;
    lDiskUsageBytes: number;
    lDlcUsageBytes: number;
    nBuildID: number;
    nCompatToolPriority: number;
    nPlaytimeForever: number;
    nScreenshots: number;
    rtLastTimePlayed: number;
    rtLastUpdated: number;
    rtPurchased: number;
    selectedLanguage: {
        strDisplayName: string;
        strShortName: string;
    };
    strCloudBytesAvailable: string;
    strCloudBytesUsed: string;
    strCompatToolDisplayName: string;
    strCompatToolName: string;
    strDeveloperName: string;
    strDeveloperURL: string;
    strDisplayName: string;
    strExternalSubscriptionURL: string;
    strFlatpakAppID: string;
    strHomepageURL: string;
    strLaunchOptions: string;
    strManualURL: string;
    strOwnerSteamID: string;
    strResolutionOverride: string;
    strSelectedBeta: string;
    strShortcutExe: string;
    strShortcutLaunchOptions: string;
    strShortcutStartDir: string;
    strSteamDeckBlogURL: string;
    unAppID: number;
    vecBetas: any[];
    vecDLC: any[];
    vecDeckCompatTestResults: any[];
    vecLanguages: AppLanguages[];
    vecLegacyCDKeys: any[];
    vecMusicAlbums: any[];
    vecPlatforms: string[];
    vecScreenShots: any[];
}

export interface AppOverview {
    __proto__: any;
    appid: number;
    display_name: string;
    app_type: number;
    mru_index: number;
    rt_recent_activity_time: number;
    minutes_playtime_forever: string;
    minutes_playtime_last_two_weeks: number;
    rt_last_time_played_or_installed: number;
    rt_last_time_played: number;
    rt_last_time_locally_played: number;
    rt_original_release_date: number;
    rt_steam_release_date: number;
    size_on_disk: string;
    m_gameid: string;
    visible_in_game_list: boolean;
    m_ulGameId: {
        low: number;
        high: number;
        unsigned: boolean;
    };
    library_capsule_filename: string;
    most_available_clientid: string;
    selected_clientid: string;
    rt_custom_image_mtime: number;
    sort_as: string;
    association: {
        name: string;
        type: number;
    }[];
    m_setStoreCategories: Set<number>;
    m_setStoreTags: Set<number>;
    per_client_data: [
        {
            clientid: string;
            client_name: string;
            display_status: number;
            status_percentage: number;
            installed: boolean;
            bytes_downloaded: string;
            bytes_total: string;
            is_available_on_current_platform: boolean;
            cloud_status: number;
        }
    ];
    canonicalAppType: number;
    local_per_client_data: {
        clientid: string;
        client_name: string;
        display_status: number;
        status_percentage: number;
        installed: boolean;
        bytes_downloaded: string;
        bytes_total: string;
        is_available_on_current_platform: boolean;
        cloud_status: number;
    };
    most_available_per_client_data: {
        clientid: string;
        client_name: string;
        display_status: number;
        status_percentage: number;
        installed: boolean;
        bytes_downloaded: string;
        bytes_total: string;
        is_available_on_current_platform: boolean;
        cloud_status: number;
    };
    selected_per_client_data: {
        clientid: string;
        client_name: string;
        display_status: number;
        status_percentage: number;
        installed: boolean;
        bytes_downloaded: string;
        bytes_total: string;
        is_available_on_current_platform: boolean;
        cloud_status: number;
    };
    review_score_with_bombs: number;
    review_percentage_with_bombs: number;
    review_score_without_bombs: number;
    review_percentage_without_bombs: number;
    steam_deck_compat_category: number;
}

export interface AppOverviewExt extends AppOverview {
    appid: number; // base
    display_name: string; // base
    sort_as: string; // base
    icon_data: string; // base, base64 encoded image
    icon_data_format: string; // base, image type without "image/" (e.g.: jpg, png)
    icon_hash: string; // base, url hash to fetch the icon for steam games (e.g.: "/assets/" + appid + "_icon.jpg?v=" + icon_hash)
  }

export interface BatteryStateChange {
    bHasBattery: boolean;
    eACState: ACState;
    eBatteryState: BatteryState;
    flLevel: number; // Battery Percentage in floating point 0-1
    nSecondsRemaining: number; // Appears to be charge time remaining or time remaining on battery
    bShutdownRequested: boolean;
}

export enum ACState {
    Unknown = 0,
    Disconnected = 1,
    Connected = 2,
    ConnectedSlow = 3,
}

export enum BatteryState {
    Unknown = 0,
    Discharging = 1,
    Charging = 2,
    Full = 3,
}

declare global {
    // @ts-ignore
    let SteamClient: SteamClient;
}
