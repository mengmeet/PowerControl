(function (React) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

    let webpackCache = {};
    let hasWebpack5 = false;
    if (window.webpackJsonp && !window.webpackJsonp.deckyShimmed) {
        // Webpack 4, currently on stable
        const wpRequire = window.webpackJsonp.push([
            [],
            { get_require: (mod, _exports, wpRequire) => (mod.exports = wpRequire) },
            [['get_require']],
        ]);
        delete wpRequire.m.get_require;
        delete wpRequire.c.get_require;
        webpackCache = wpRequire.c;
    }
    else {
        // Webpack 5, currently on beta
        hasWebpack5 = true;
        const id = Math.random();
        let initReq;
        window.webpackChunksteamui.push([
            [id],
            {},
            (r) => {
                initReq = r;
            },
        ]);
        for (let i of Object.keys(initReq.m)) {
            webpackCache[i] = initReq(i);
        }
    }
    const allModules = hasWebpack5
        ? Object.values(webpackCache).filter((x) => x)
        : Object.keys(webpackCache)
            .map((x) => webpackCache[x].exports)
            .filter((x) => x);
    const findModule = (filter) => {
        for (const m of allModules) {
            if (m.default && filter(m.default))
                return m.default;
            if (filter(m))
                return m;
        }
    };
    const findModuleChild = (filter) => {
        for (const m of allModules) {
            for (const mod of [m.default, m]) {
                const filterRes = filter(mod);
                if (filterRes) {
                    return filterRes;
                }
                else {
                    continue;
                }
            }
        }
    };
    const CommonUIModule = allModules.find((m) => {
        if (typeof m !== 'object')
            return false;
        for (let prop in m) {
            if (m[prop]?.contextType?._currentValue && Object.keys(m).length > 60)
                return true;
        }
        return false;
    });
    findModule((m) => {
        if (typeof m !== 'object')
            return false;
        for (let prop in m) {
            if (m[prop]?.toString && /Spinner\)}\),.\.createElement\(\"path\",{d:\"M18 /.test(m[prop].toString()))
                return true;
        }
        return false;
    });
    allModules.find((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.computeRootMatch)
                return true;
        }
        return false;
    });

    const CommonDialogDivs = Object.values(CommonUIModule).filter((m) => typeof m === 'object' && m?.render?.toString().includes('"div",Object.assign({},'));
    const MappedDialogDivs = new Map(Object.values(CommonDialogDivs).map((m) => {
        const renderedDiv = m.render({});
        // Take only the first class name segment as it identifies the element we want
        return [renderedDiv.props.className.split(' ')[0], m];
    }));
    MappedDialogDivs.get('DialogHeader');
    MappedDialogDivs.get('DialogSubHeader');
    MappedDialogDivs.get('DialogFooter');
    MappedDialogDivs.get('DialogLabel');
    MappedDialogDivs.get('DialogBodyText');
    MappedDialogDivs.get('DialogBody');
    MappedDialogDivs.get('DialogControlsSection');
    MappedDialogDivs.get('DialogControlsSectionHeader');
    Object.values(CommonUIModule).find((mod) => mod?.render?.toString()?.includes('DialogButton') && mod?.render?.toString()?.includes('Primary'));
    const DialogButtonSecondary = Object.values(CommonUIModule).find((mod) => mod?.render?.toString()?.includes('Object.assign({type:"button"') &&
        mod?.render?.toString()?.includes('DialogButton') &&
        mod?.render?.toString()?.includes('Secondary'));
    // This is the "main" button. The Primary can act as a submit button,
    // therefore secondary is chosen (also for backwards comp. reasons)
    const DialogButton = DialogButtonSecondary;

    const ButtonItem = CommonUIModule.ButtonField ||
        Object.values(CommonUIModule).find((mod) => mod?.render?.toString()?.includes('"highlightOnFocus","childrenContainerWidth"') ||
            mod?.render?.toString()?.includes('childrenContainerWidth:"min"'));

    const Dropdown = Object.values(CommonUIModule).find((mod) => mod?.prototype?.SetSelectedOption && mod?.prototype?.BuildMenu);
    Object.values(CommonUIModule).find((mod) => mod?.toString()?.includes('"dropDownControlRef","description"'));

    const Field = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.render?.toString().includes('"shift-children-below"'))
                return m[prop];
        }
    });

    const Focusable = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.render?.toString()?.includes('["flow-children","onActivate","onCancel","focusClassName",'))
                return m[prop];
        }
    });

    const Marquee = findModuleChild((m) => {
        if (typeof m !== 'object')
            return;
        for (const prop in m) {
            if (m[prop]?.toString && m[prop].toString().includes('.Marquee') && m[prop].toString().includes('--fade-length')) {
                return m[prop];
            }
        }
        return;
    });

    function sleep(ms) {
        return new Promise((res) => setTimeout(res, ms));
    }
    /**
     * Finds the SP window, since it is a render target as of 10-19-2022's beta
     */
    function findSP() {
        // old (SP as host)
        if (document.title == 'SP')
            return window;
        // new (SP as popup)
        const navTrees = getGamepadNavigationTrees();
        return navTrees?.find((x) => x.m_ID == 'root_1_').Root.Element.ownerDocument.defaultView;
    }
    /**
     * Gets the correct FocusNavController, as the Feb 22 2023 beta has two for some reason.
     */
    function getFocusNavController() {
        return window.GamepadNavTree?.m_context?.m_controller || window.FocusNavController;
    }
    /**
     * Gets the gamepad navigation trees as Valve seems to be moving them.
     */
    function getGamepadNavigationTrees() {
        const focusNav = getFocusNavController();
        const context = focusNav.m_ActiveContext || focusNav.m_LastActiveContext;
        return context?.m_rgGamepadNavigationTrees;
    }

    const showModalRaw = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (typeof m[prop] === 'function' &&
                m[prop].toString().includes('props.bDisableBackgroundDismiss') &&
                !m[prop]?.prototype?.Cancel) {
                return m[prop];
            }
        }
    });
    const oldShowModalRaw = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (typeof m[prop] === 'function' && m[prop].toString().includes('bHideMainWindowForPopouts:!0')) {
                return m[prop];
            }
        }
    });
    const showModal = (modal, parent, props = {
        strTitle: 'Decky Dialog',
        bHideMainWindowForPopouts: false,
    }) => {
        if (showModalRaw) {
            return showModalRaw(modal, parent || findSP(), props.strTitle, props, undefined, {
                bHideActions: props.bHideActionIcons,
            });
        }
        else if (oldShowModalRaw) {
            return oldShowModalRaw(modal, parent || findSP(), props);
        }
        else {
            throw new Error('[DFL:Modals]: Cannot find showModal function');
        }
    };
    findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (!m[prop]?.prototype?.OK && m[prop]?.prototype?.Cancel && m[prop]?.prototype?.render) {
                return m[prop];
            }
        }
    });
    // new as of december 2022 on beta
    const ModalRoot = (Object.values(findModule((m) => {
        if (typeof m !== 'object')
            return false;
        for (let prop in m) {
            if (m[prop]?.m_mapModalManager && Object.values(m)?.find((x) => x?.type)) {
                return true;
            }
        }
        return false;
    }) || {})?.find((x) => x?.type?.toString()?.includes('((function(){')) ||
        // before december 2022 beta
        Object.values(findModule((m) => {
            if (typeof m !== 'object')
                return false;
            for (let prop in m) {
                if (m[prop]?.toString()?.includes('"ModalManager","DialogWrapper"')) {
                    return true;
                }
            }
            return false;
        }) || {})?.find((x) => x?.type?.toString()?.includes('((function(){')) ||
        // old
        findModuleChild((m) => {
            if (typeof m !== 'object')
                return undefined;
            for (let prop in m) {
                if (m[prop]?.prototype?.OK && m[prop]?.prototype?.Cancel && m[prop]?.prototype?.render) {
                    return m[prop];
                }
            }
        }));

    const [panelSection, mod] = findModuleChild((mod) => {
        for (let prop in mod) {
            if (mod[prop]?.toString()?.includes('.PanelSection')) {
                return [mod[prop], mod];
            }
        }
        return null;
    });
    const PanelSection = panelSection;
    // New as of Feb 22 2023 Beta || Old
    const PanelSectionRow = mod.PanelSectionRow ||
        Object.values(mod).filter((exp) => !exp?.toString()?.includes('.PanelSection'))[0];

    var SideMenu;
    (function (SideMenu) {
        SideMenu[SideMenu["None"] = 0] = "None";
        SideMenu[SideMenu["Main"] = 1] = "Main";
        SideMenu[SideMenu["QuickAccess"] = 2] = "QuickAccess";
    })(SideMenu || (SideMenu = {}));
    var QuickAccessTab;
    (function (QuickAccessTab) {
        QuickAccessTab[QuickAccessTab["Notifications"] = 0] = "Notifications";
        QuickAccessTab[QuickAccessTab["RemotePlayTogetherControls"] = 1] = "RemotePlayTogetherControls";
        QuickAccessTab[QuickAccessTab["VoiceChat"] = 2] = "VoiceChat";
        QuickAccessTab[QuickAccessTab["Friends"] = 3] = "Friends";
        QuickAccessTab[QuickAccessTab["Settings"] = 4] = "Settings";
        QuickAccessTab[QuickAccessTab["Perf"] = 5] = "Perf";
        QuickAccessTab[QuickAccessTab["Help"] = 6] = "Help";
        QuickAccessTab[QuickAccessTab["Music"] = 7] = "Music";
        QuickAccessTab[QuickAccessTab["Decky"] = 999] = "Decky";
    })(QuickAccessTab || (QuickAccessTab = {}));
    var DisplayStatus;
    (function (DisplayStatus) {
        DisplayStatus[DisplayStatus["Invalid"] = 0] = "Invalid";
        DisplayStatus[DisplayStatus["Launching"] = 1] = "Launching";
        DisplayStatus[DisplayStatus["Uninstalling"] = 2] = "Uninstalling";
        DisplayStatus[DisplayStatus["Installing"] = 3] = "Installing";
        DisplayStatus[DisplayStatus["Running"] = 4] = "Running";
        DisplayStatus[DisplayStatus["Validating"] = 5] = "Validating";
        DisplayStatus[DisplayStatus["Updating"] = 6] = "Updating";
        DisplayStatus[DisplayStatus["Downloading"] = 7] = "Downloading";
        DisplayStatus[DisplayStatus["Synchronizing"] = 8] = "Synchronizing";
        DisplayStatus[DisplayStatus["ReadyToInstall"] = 9] = "ReadyToInstall";
        DisplayStatus[DisplayStatus["ReadyToPreload"] = 10] = "ReadyToPreload";
        DisplayStatus[DisplayStatus["ReadyToLaunch"] = 11] = "ReadyToLaunch";
        DisplayStatus[DisplayStatus["RegionRestricted"] = 12] = "RegionRestricted";
        DisplayStatus[DisplayStatus["PresaleOnly"] = 13] = "PresaleOnly";
        DisplayStatus[DisplayStatus["InvalidPlatform"] = 14] = "InvalidPlatform";
        DisplayStatus[DisplayStatus["PreloadComplete"] = 16] = "PreloadComplete";
        DisplayStatus[DisplayStatus["BorrowerLocked"] = 17] = "BorrowerLocked";
        DisplayStatus[DisplayStatus["UpdatePaused"] = 18] = "UpdatePaused";
        DisplayStatus[DisplayStatus["UpdateQueued"] = 19] = "UpdateQueued";
        DisplayStatus[DisplayStatus["UpdateRequired"] = 20] = "UpdateRequired";
        DisplayStatus[DisplayStatus["UpdateDisabled"] = 21] = "UpdateDisabled";
        DisplayStatus[DisplayStatus["DownloadPaused"] = 22] = "DownloadPaused";
        DisplayStatus[DisplayStatus["DownloadQueued"] = 23] = "DownloadQueued";
        DisplayStatus[DisplayStatus["DownloadRequired"] = 24] = "DownloadRequired";
        DisplayStatus[DisplayStatus["DownloadDisabled"] = 25] = "DownloadDisabled";
        DisplayStatus[DisplayStatus["LicensePending"] = 26] = "LicensePending";
        DisplayStatus[DisplayStatus["LicenseExpired"] = 27] = "LicenseExpired";
        DisplayStatus[DisplayStatus["AvailForFree"] = 28] = "AvailForFree";
        DisplayStatus[DisplayStatus["AvailToBorrow"] = 29] = "AvailToBorrow";
        DisplayStatus[DisplayStatus["AvailGuestPass"] = 30] = "AvailGuestPass";
        DisplayStatus[DisplayStatus["Purchase"] = 31] = "Purchase";
        DisplayStatus[DisplayStatus["Unavailable"] = 32] = "Unavailable";
        DisplayStatus[DisplayStatus["NotLaunchable"] = 33] = "NotLaunchable";
        DisplayStatus[DisplayStatus["CloudError"] = 34] = "CloudError";
        DisplayStatus[DisplayStatus["CloudOutOfDate"] = 35] = "CloudOutOfDate";
        DisplayStatus[DisplayStatus["Terminating"] = 36] = "Terminating";
    })(DisplayStatus || (DisplayStatus = {}));
    const Router = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.Navigate && m[prop]?.NavigationManager)
                return m[prop];
        }
    });
    let Navigation = {};
    try {
        (async () => {
            let InternalNavigators = {};
            if (!Router.NavigateToAppProperties || Router.deckyShim) {
                function initInternalNavigators() {
                    try {
                        InternalNavigators = findModuleChild((m) => {
                            if (typeof m !== 'object')
                                return undefined;
                            for (let prop in m) {
                                if (m[prop]?.GetNavigator) {
                                    return m[prop];
                                }
                            }
                        })?.GetNavigator();
                    }
                    catch (e) {
                        console.error('[DFL:Router]: Failed to init internal navigators, trying again');
                    }
                }
                initInternalNavigators();
                while (!InternalNavigators?.AppProperties) {
                    console.log('[DFL:Router]: Trying to init internal navigators again');
                    await sleep(100);
                    initInternalNavigators();
                }
            }
            const newNavigation = {
                Navigate: Router.Navigate?.bind(Router),
                NavigateBack: Router.WindowStore?.GamepadUIMainWindowInstance?.NavigateBack?.bind(Router.WindowStore.GamepadUIMainWindowInstance),
                NavigateToAppProperties: InternalNavigators?.AppProperties || Router.NavigateToAppProperties?.bind(Router),
                NavigateToExternalWeb: InternalNavigators?.ExternalWeb || Router.NavigateToExternalWeb?.bind(Router),
                NavigateToInvites: InternalNavigators?.Invites || Router.NavigateToInvites?.bind(Router),
                NavigateToChat: Router.NavigateToChat?.bind(Router),
                NavigateToLibraryTab: InternalNavigators?.LibraryTab || Router.NavigateToLibraryTab?.bind(Router),
                NavigateToLayoutPreview: Router.NavigateToLayoutPreview?.bind(Router),
                NavigateToSteamWeb: Router.WindowStore?.GamepadUIMainWindowInstance?.NavigateToSteamWeb?.bind(Router.WindowStore.GamepadUIMainWindowInstance),
                OpenSideMenu: Router.WindowStore?.GamepadUIMainWindowInstance?.MenuStore.OpenSideMenu?.bind(Router.WindowStore.GamepadUIMainWindowInstance.MenuStore),
                OpenQuickAccessMenu: Router.WindowStore?.GamepadUIMainWindowInstance?.MenuStore.OpenQuickAccessMenu?.bind(Router.WindowStore.GamepadUIMainWindowInstance.MenuStore),
                OpenMainMenu: Router.WindowStore?.GamepadUIMainWindowInstance?.MenuStore.OpenMainMenu?.bind(Router.WindowStore.GamepadUIMainWindowInstance.MenuStore),
                CloseSideMenus: Router.CloseSideMenus?.bind(Router),
                OpenPowerMenu: Router.OpenPowerMenu?.bind(Router),
            };
            Object.assign(Navigation, newNavigation);
        })();
    }
    catch (e) {
        console.error('[DFL:Router]: Error initializing Navigation interface', e);
    }

    const SliderField = Object.values(CommonUIModule).find((mod) => mod?.toString()?.includes('SliderField,fallback'));

    const quickAccessMenuClasses = findModule((mod) => typeof mod === 'object' && mod?.Title?.includes('quickaccessmenu'));
    /**
     * @depreciated please use quickAccessMenuClasses instead
     */
    const staticClasses = quickAccessMenuClasses;
    findModule((mod) => typeof mod === 'object' && mod?.ScrollPanel?.includes('scrollpanel'));
    findModule((mod) => typeof mod === 'object' && mod?.GamepadDialogContent?.includes('gamepaddialog'));
    findModule((mod) => typeof mod === 'object' && typeof mod?.PanelSection === 'string' && mod?.PanelSection?.includes('quickaccesscontrols'));
    findModule((mod) => typeof mod === 'object' && mod?.OOBEUpdateStatusContainer?.includes('updaterfield'));
    findModule((mod) => typeof mod === 'object' && mod?.Container?.includes('appdetailsplaysection'));
    findModule((mod) => typeof mod === 'object' && mod?.SliderControlPanelGroup?.includes('gamepadslider'));
    findModule((mod) => typeof mod === 'object' && mod?.TopCapsule?.includes('sharedappdetailsheader'));
    findModule((mod) => typeof mod === 'object' && mod?.HeaderLoaded?.includes('appdetails_'));
    findModule((mod) => typeof mod === 'object' && mod?.BasicUiRoot?.includes('gamepadui_'));

    const SteamSpinner = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.toString?.()?.includes('Steam Spinner') && m[prop]?.toString?.()?.includes('src'))
                return m[prop];
        }
    });

    const TextField = Object.values(CommonUIModule).find((mod) => mod?.validateUrl && mod?.validateEmail);

    const ToggleField = Object.values(CommonUIModule).find((mod) => mod?.render?.toString()?.includes('ToggleField,fallback'));

    var FileSelectionType;
    (function (FileSelectionType) {
        FileSelectionType[FileSelectionType["FILE"] = 0] = "FILE";
        FileSelectionType[FileSelectionType["FOLDER"] = 1] = "FOLDER";
    })(FileSelectionType || (FileSelectionType = {}));
    // TypeScript helper function
    const definePlugin = (fn) => {
        return (...args) => {
            // TODO: Maybe wrap this
            return fn(...args);
        };
    };

    var DefaultContext = {
      color: undefined,
      size: undefined,
      className: undefined,
      style: undefined,
      attr: undefined
    };
    var IconContext = React__default["default"].createContext && React__default["default"].createContext(DefaultContext);

    var __assign$1 = window && window.__assign || function () {
      __assign$1 = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];

          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }

        return t;
      };

      return __assign$1.apply(this, arguments);
    };

    var __rest = window && window.__rest || function (s, e) {
      var t = {};

      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];

      if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
      }
      return t;
    };

    function Tree2Element(tree) {
      return tree && tree.map(function (node, i) {
        return React__default["default"].createElement(node.tag, __assign$1({
          key: i
        }, node.attr), Tree2Element(node.child));
      });
    }

    function GenIcon(data) {
      return function (props) {
        return React__default["default"].createElement(IconBase, __assign$1({
          attr: __assign$1({}, data.attr)
        }, props), Tree2Element(data.child));
      };
    }
    function IconBase(props) {
      var elem = function (conf) {
        var attr = props.attr,
            size = props.size,
            title = props.title,
            svgProps = __rest(props, ["attr", "size", "title"]);

        var computedSize = size || conf.size || "1em";
        var className;
        if (conf.className) className = conf.className;
        if (props.className) className = (className ? className + ' ' : '') + props.className;
        return React__default["default"].createElement("svg", __assign$1({
          stroke: "currentColor",
          fill: "currentColor",
          strokeWidth: "0"
        }, conf.attr, attr, svgProps, {
          className: className,
          style: __assign$1(__assign$1({
            color: props.color || conf.color
          }, conf.style), props.style),
          height: computedSize,
          width: computedSize,
          xmlns: "http://www.w3.org/2000/svg"
        }), title && React__default["default"].createElement("title", null, title), props.children);
      };

      return IconContext !== undefined ? React__default["default"].createElement(IconContext.Consumer, null, function (conf) {
        return elem(conf);
      }) : elem(DefaultContext);
    }

    // THIS FILE IS AUTO GENERATED
    function FaSuperpowers (props) {
      return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 32c-83.3 11-166.8 22-250 33-92 12.5-163.3 86.7-169 180-3.3 55.5 18 109.5 57.8 148.2L0 480c83.3-11 166.5-22 249.8-33 91.8-12.5 163.3-86.8 168.7-179.8 3.5-55.5-18-109.5-57.7-148.2L448 32zm-79.7 232.3c-4.2 79.5-74 139.2-152.8 134.5-79.5-4.7-140.7-71-136.3-151 4.5-79.2 74.3-139.3 153-134.5 79.3 4.7 140.5 71 136.1 151z"}}]})(props);
    }

    var GPUMODE;
    (function (GPUMODE) {
        GPUMODE[GPUMODE["NOLIMIT"] = 0] = "NOLIMIT";
        GPUMODE[GPUMODE["FIX"] = 1] = "FIX";
        GPUMODE[GPUMODE["RANGE"] = 2] = "RANGE";
        GPUMODE[GPUMODE["AUTO"] = 3] = "AUTO";
    })(GPUMODE || (GPUMODE = {}));
    var FANMODE;
    (function (FANMODE) {
        FANMODE[FANMODE["NOCONTROL"] = 0] = "NOCONTROL";
        FANMODE[FANMODE["FIX"] = 1] = "FIX";
        FANMODE[FANMODE["CURVE"] = 2] = "CURVE";
    })(FANMODE || (FANMODE = {}));
    var FANPROFILEACTION;
    (function (FANPROFILEACTION) {
        FANPROFILEACTION["DELETE"] = "DELETE";
        FANPROFILEACTION["USE"] = "USE";
    })(FANPROFILEACTION || (FANPROFILEACTION = {}));
    var APPLYTYPE;
    (function (APPLYTYPE) {
        APPLYTYPE["SET_ALL"] = "ALL";
        APPLYTYPE["SET_CPUBOOST"] = "SET_CPUBOOST";
        APPLYTYPE["SET_CPUCORE"] = "SET_CPUCORE";
        APPLYTYPE["SET_TDP"] = "SET_TDP";
        APPLYTYPE["SET_GPUMODE"] = "SET_GPUMODE";
        APPLYTYPE["SET_FANMODE"] = "SET_FANMODE";
        APPLYTYPE["SET_FANRPM"] = "SET_FANRPM";
    })(APPLYTYPE || (APPLYTYPE = {}));
    var ComponentName;
    (function (ComponentName) {
        ComponentName["SET_ENABLE"] = "SET_ENABLE";
        ComponentName["SET_PERAPP"] = "SET_PERAPP";
        ComponentName["CPU_ALL"] = "CPU_ALL";
        ComponentName["CPU_BOOST"] = "CPU_BOOST";
        ComponentName["CPU_SMT"] = "CPU_SMT";
        ComponentName["CPU_NUM"] = "CPU_NUM";
        ComponentName["CPU_TDP"] = "CPU_TDP";
        ComponentName["GPU_ALL"] = "GPU_ALL";
        ComponentName["GPU_FREQMODE"] = "GPU_FREQMODE";
        ComponentName["GPU_FREQFIX"] = "GPU_FREQFIX";
        ComponentName["GPU_FREQRANGE"] = "GPU_FREQRANGE";
        ComponentName["GPU_FREQAUTO"] = "GPU_FREQAUTO";
        ComponentName["FAN_ALL"] = "FAN_ALL";
        ComponentName["FAN_RPM"] = "FAN_RPM";
        ComponentName["FAN_DISPLAY"] = "FAN_DISPLAY";
    })(ComponentName || (ComponentName = {}));
    var UpdateType;
    (function (UpdateType) {
        UpdateType["DISABLE"] = "DISABLE";
        UpdateType["UPDATE"] = "UPDATE";
        UpdateType["HIDE"] = "HIDE";
        UpdateType["SHOW"] = "SHOW";
        UpdateType["ENABLE"] = "ENABLE";
        UpdateType["DISMOUNT"] = "DISMOUNT";
    })(UpdateType || (UpdateType = {}));
    var PluginState;
    (function (PluginState) {
        PluginState["INIT"] = "0";
        PluginState["RUN"] = "1";
        PluginState["QUIT"] = "2";
    })(PluginState || (PluginState = {}));

    var TITEL_SETTINGS$9 = "设置";
    var ENABLE_SETTINGS$9 = "启用插件设置";
    var USE_PERGAME_PROFILE$9 = "使用按游戏设置的配置文件";
    var USING$9 = "正在使用";
    var DEFAULT$9 = "默认";
    var PROFILE$9 = "配置文件";
    var CPU_BOOST$9 = "睿 频";
    var CPU_BOOST_DESC$9 = "提升最大cpu频率";
    var SMT_DESC$9 = "启用奇数编号的cpu";
    var CPU_NUM$9 = "核 心 数";
    var CPU_NUM_DESC$9 = "设置启用的物理核心数量";
    var TDP$9 = "热设计功耗 (TDP) 限制";
    var TDP_DESC$9 = "限制处理器功耗以降低总功耗";
    var RYZENADJ_NOT_FOUND$9 = "未检测到ryzenAdj";
    var WATTS$9 = "瓦特";
    var GPU_FREQMODE$9 = "GPU 频率模式";
    var UNLIMITED$9 = "不限制";
    var FIXED_FREQ$9 = "固定频率";
    var RANGE_FREQ$9 = "范围频率";
    var AUTO_FREQ$9 = "自适应";
    var GPU_FIX_FREQ$9 = "GPU 频率";
    var GPU_MIN_FREQ$9 = "GPU 最小频率限制";
    var GPU_MAX_FREQ$9 = "GPU 最大频率限制";
    var FAN_SPEED$9 = "风扇转速";
    var CREATE_FAN_PROFILE$9 = "创建风扇配置文件";
    var GRID_ALIG$9 = "网格对齐";
    var FAN_MODE$9 = "风扇模式";
    var NOT_CONTROLLED$9 = "不控制";
    var FIXED$9 = "固定";
    var CURVE$9 = "曲线";
    var SNAP_GRIDLINE$9 = "对齐到网格线交点";
    var FAN_SPEED_PERCENT$9 = "风扇转速百分比";
    var SENSOR_TEMP$9 = "传感器温度";
    var CREATE_FAN_PROFILE_TIP$9 = "创建一个风扇配置文件";
    var SELECT_FAN_PROFILE_TIP$9 = "选择一个风扇配置文件";
    var FAN_PROFILE_NAME$9 = "配置文件名称";
    var USE$9 = "使用";
    var DELETE$9 = "删除";
    var CREATE$9 = "创建";
    var CANCEL$9 = "取消";
    var CURENT_STAT$9 = "当前状态";
    var schinese = {
    	TITEL_SETTINGS: TITEL_SETTINGS$9,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$9,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$9,
    	USING: USING$9,
    	DEFAULT: DEFAULT$9,
    	PROFILE: PROFILE$9,
    	CPU_BOOST: CPU_BOOST$9,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$9,
    	SMT_DESC: SMT_DESC$9,
    	CPU_NUM: CPU_NUM$9,
    	CPU_NUM_DESC: CPU_NUM_DESC$9,
    	TDP: TDP$9,
    	TDP_DESC: TDP_DESC$9,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$9,
    	WATTS: WATTS$9,
    	GPU_FREQMODE: GPU_FREQMODE$9,
    	UNLIMITED: UNLIMITED$9,
    	FIXED_FREQ: FIXED_FREQ$9,
    	RANGE_FREQ: RANGE_FREQ$9,
    	AUTO_FREQ: AUTO_FREQ$9,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$9,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$9,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$9,
    	FAN_SPEED: FAN_SPEED$9,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$9,
    	GRID_ALIG: GRID_ALIG$9,
    	FAN_MODE: FAN_MODE$9,
    	NOT_CONTROLLED: NOT_CONTROLLED$9,
    	FIXED: FIXED$9,
    	CURVE: CURVE$9,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$9,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$9,
    	SENSOR_TEMP: SENSOR_TEMP$9,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$9,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$9,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$9,
    	USE: USE$9,
    	DELETE: DELETE$9,
    	CREATE: CREATE$9,
    	CANCEL: CANCEL$9,
    	CURENT_STAT: CURENT_STAT$9
    };

    var schinese$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$9,
        ENABLE_SETTINGS: ENABLE_SETTINGS$9,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$9,
        USING: USING$9,
        DEFAULT: DEFAULT$9,
        PROFILE: PROFILE$9,
        CPU_BOOST: CPU_BOOST$9,
        CPU_BOOST_DESC: CPU_BOOST_DESC$9,
        SMT_DESC: SMT_DESC$9,
        CPU_NUM: CPU_NUM$9,
        CPU_NUM_DESC: CPU_NUM_DESC$9,
        TDP: TDP$9,
        TDP_DESC: TDP_DESC$9,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$9,
        WATTS: WATTS$9,
        GPU_FREQMODE: GPU_FREQMODE$9,
        UNLIMITED: UNLIMITED$9,
        FIXED_FREQ: FIXED_FREQ$9,
        RANGE_FREQ: RANGE_FREQ$9,
        AUTO_FREQ: AUTO_FREQ$9,
        GPU_FIX_FREQ: GPU_FIX_FREQ$9,
        GPU_MIN_FREQ: GPU_MIN_FREQ$9,
        GPU_MAX_FREQ: GPU_MAX_FREQ$9,
        FAN_SPEED: FAN_SPEED$9,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$9,
        GRID_ALIG: GRID_ALIG$9,
        FAN_MODE: FAN_MODE$9,
        NOT_CONTROLLED: NOT_CONTROLLED$9,
        FIXED: FIXED$9,
        CURVE: CURVE$9,
        SNAP_GRIDLINE: SNAP_GRIDLINE$9,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$9,
        SENSOR_TEMP: SENSOR_TEMP$9,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$9,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$9,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$9,
        USE: USE$9,
        DELETE: DELETE$9,
        CREATE: CREATE$9,
        CANCEL: CANCEL$9,
        CURENT_STAT: CURENT_STAT$9,
        'default': schinese
    });

    var TITEL_SETTINGS$8 = "設定";
    var ENABLE_SETTINGS$8 = "啟用插件功能列";
    var USE_PERGAME_PROFILE$8 = "使用按遊戲設定的配置文件";
    var USING$8 = "正在使用";
    var DEFAULT$8 = "默認";
    var PROFILE$8 = "配置文件";
    var CPU_BOOST$8 = "睿頻模式";
    var CPU_BOOST_DESC$8 = "提升最大cpu頻率";
    var SMT_DESC$8 = "啟用多執行續";
    var CPU_NUM$8 = "CPU內核數";
    var CPU_NUM_DESC$8 = "設置啟用CPU內核數量";
    var TDP$8 = "散熱設計功率 (TDP) 限制";
    var TDP_DESC$8 = "限制處理器功率以降低總功率";
    var RYZENADJ_NOT_FOUND$8 = "未檢測到ryzenAdj文件";
    var WATTS$8 = "瓦特(W)";
    var GPU_FREQMODE$8 = "GPU 頻率模式";
    var UNLIMITED$8 = "不限制";
    var FIXED_FREQ$8 = "鎖定頻率";
    var RANGE_FREQ$8 = "範圍頻率S";
    var AUTO_FREQ$8 = "自適應";
    var GPU_FIX_FREQ$8 = "GPU 頻率";
    var GPU_MIN_FREQ$8 = "GPU 最小頻率限制";
    var GPU_MAX_FREQ$8 = "GPU 最大頻率限制";
    var FAN_SPEED$8 = "風扇轉速";
    var CREATE_FAN_PROFILE$8 = "創建風扇配置檔";
    var GRID_ALIG$8 = "網格對齊";
    var FAN_MODE$8 = "風扇模式";
    var NOT_CONTROLLED$8 = "不控制";
    var FIXED$8 = "固定";
    var CURVE$8 = "曲線";
    var SNAP_GRIDLINE$8 = "對齊到網格線交點";
    var FAN_SPEED_PERCENT$8 = "風扇轉速百分比";
    var SENSOR_TEMP$8 = "感測器溫度";
    var CREATE_FAN_PROFILE_TIP$8 = "創建一個風扇配置檔";
    var SELECT_FAN_PROFILE_TIP$8 = "選擇一個風扇配置檔";
    var FAN_PROFILE_NAME$8 = "配置檔名稱";
    var USE$8 = "使用";
    var DELETE$8 = "删除";
    var CREATE$8 = "创建";
    var CANCEL$8 = "取消";
    var CURENT_STAT$8 = "当前状态";
    var tchinese = {
    	TITEL_SETTINGS: TITEL_SETTINGS$8,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$8,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$8,
    	USING: USING$8,
    	DEFAULT: DEFAULT$8,
    	PROFILE: PROFILE$8,
    	CPU_BOOST: CPU_BOOST$8,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$8,
    	SMT_DESC: SMT_DESC$8,
    	CPU_NUM: CPU_NUM$8,
    	CPU_NUM_DESC: CPU_NUM_DESC$8,
    	TDP: TDP$8,
    	TDP_DESC: TDP_DESC$8,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$8,
    	WATTS: WATTS$8,
    	GPU_FREQMODE: GPU_FREQMODE$8,
    	UNLIMITED: UNLIMITED$8,
    	FIXED_FREQ: FIXED_FREQ$8,
    	RANGE_FREQ: RANGE_FREQ$8,
    	AUTO_FREQ: AUTO_FREQ$8,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$8,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$8,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$8,
    	FAN_SPEED: FAN_SPEED$8,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$8,
    	GRID_ALIG: GRID_ALIG$8,
    	FAN_MODE: FAN_MODE$8,
    	NOT_CONTROLLED: NOT_CONTROLLED$8,
    	FIXED: FIXED$8,
    	CURVE: CURVE$8,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$8,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$8,
    	SENSOR_TEMP: SENSOR_TEMP$8,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$8,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$8,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$8,
    	USE: USE$8,
    	DELETE: DELETE$8,
    	CREATE: CREATE$8,
    	CANCEL: CANCEL$8,
    	CURENT_STAT: CURENT_STAT$8
    };

    var tchinese$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$8,
        ENABLE_SETTINGS: ENABLE_SETTINGS$8,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$8,
        USING: USING$8,
        DEFAULT: DEFAULT$8,
        PROFILE: PROFILE$8,
        CPU_BOOST: CPU_BOOST$8,
        CPU_BOOST_DESC: CPU_BOOST_DESC$8,
        SMT_DESC: SMT_DESC$8,
        CPU_NUM: CPU_NUM$8,
        CPU_NUM_DESC: CPU_NUM_DESC$8,
        TDP: TDP$8,
        TDP_DESC: TDP_DESC$8,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$8,
        WATTS: WATTS$8,
        GPU_FREQMODE: GPU_FREQMODE$8,
        UNLIMITED: UNLIMITED$8,
        FIXED_FREQ: FIXED_FREQ$8,
        RANGE_FREQ: RANGE_FREQ$8,
        AUTO_FREQ: AUTO_FREQ$8,
        GPU_FIX_FREQ: GPU_FIX_FREQ$8,
        GPU_MIN_FREQ: GPU_MIN_FREQ$8,
        GPU_MAX_FREQ: GPU_MAX_FREQ$8,
        FAN_SPEED: FAN_SPEED$8,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$8,
        GRID_ALIG: GRID_ALIG$8,
        FAN_MODE: FAN_MODE$8,
        NOT_CONTROLLED: NOT_CONTROLLED$8,
        FIXED: FIXED$8,
        CURVE: CURVE$8,
        SNAP_GRIDLINE: SNAP_GRIDLINE$8,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$8,
        SENSOR_TEMP: SENSOR_TEMP$8,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$8,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$8,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$8,
        USE: USE$8,
        DELETE: DELETE$8,
        CREATE: CREATE$8,
        CANCEL: CANCEL$8,
        CURENT_STAT: CURENT_STAT$8,
        'default': tchinese
    });

    var TITEL_SETTINGS$7 = "Settings";
    var ENABLE_SETTINGS$7 = "Enable Settings";
    var USE_PERGAME_PROFILE$7 = "Use per-game Profile";
    var USING$7 = "Using";
    var DEFAULT$7 = " default ";
    var PROFILE$7 = "Profile";
    var CPU_BOOST$7 = "CPU Boost";
    var CPU_BOOST_DESC$7 = "Increase the maximum CPU frequency";
    var SMT_DESC$7 = "Enables odd-numbered CPUs";
    var CPU_NUM$7 = "Number Of CPU Cores";
    var CPU_NUM_DESC$7 = "Set the enabled physical core";
    var TDP$7 = "Thermal Power (TDP) Limit";
    var TDP_DESC$7 = "Limits processor power for less total power";
    var RYZENADJ_NOT_FOUND$7 = "RyzenAdj Not Detected";
    var WATTS$7 = "Watts";
    var GPU_FREQMODE$7 = "GPU Clock Frequency Mode";
    var UNLIMITED$7 = "Unlimited";
    var FIXED_FREQ$7 = "Fixed";
    var RANGE_FREQ$7 = "Range";
    var AUTO_FREQ$7 = "Auto";
    var GPU_FIX_FREQ$7 = "GPU Clock Frequency";
    var GPU_MIN_FREQ$7 = "Minimum Frequency Limit";
    var GPU_MAX_FREQ$7 = "Maximum Frequency Limit";
    var FAN_SPEED$7 = "Fan Speed";
    var CREATE_FAN_PROFILE$7 = "Create Fan Profile";
    var GRID_ALIG$7 = "Grid Alignment";
    var FAN_MODE$7 = "Fan Mode";
    var NOT_CONTROLLED$7 = "Not Controlled";
    var FIXED$7 = "Fixed";
    var CURVE$7 = "Curve";
    var SNAP_GRIDLINE$7 = "Snap To The Gridline Intersection";
    var FAN_SPEED_PERCENT$7 = "Fan Speed Percentage";
    var SENSOR_TEMP$7 = "Sensor Temperature";
    var CREATE_FAN_PROFILE_TIP$7 = "Create a Fan Profile";
    var SELECT_FAN_PROFILE_TIP$7 = "Select a Fan Profile";
    var FAN_PROFILE_NAME$7 = "Profile Name";
    var USE$7 = "Use";
    var DELETE$7 = "Delete";
    var CREATE$7 = "Create";
    var CANCEL$7 = "Cancel";
    var CURENT_STAT$7 = "Current status";
    var english = {
    	TITEL_SETTINGS: TITEL_SETTINGS$7,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$7,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$7,
    	USING: USING$7,
    	DEFAULT: DEFAULT$7,
    	PROFILE: PROFILE$7,
    	CPU_BOOST: CPU_BOOST$7,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$7,
    	SMT_DESC: SMT_DESC$7,
    	CPU_NUM: CPU_NUM$7,
    	CPU_NUM_DESC: CPU_NUM_DESC$7,
    	TDP: TDP$7,
    	TDP_DESC: TDP_DESC$7,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$7,
    	WATTS: WATTS$7,
    	GPU_FREQMODE: GPU_FREQMODE$7,
    	UNLIMITED: UNLIMITED$7,
    	FIXED_FREQ: FIXED_FREQ$7,
    	RANGE_FREQ: RANGE_FREQ$7,
    	AUTO_FREQ: AUTO_FREQ$7,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$7,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$7,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$7,
    	FAN_SPEED: FAN_SPEED$7,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$7,
    	GRID_ALIG: GRID_ALIG$7,
    	FAN_MODE: FAN_MODE$7,
    	NOT_CONTROLLED: NOT_CONTROLLED$7,
    	FIXED: FIXED$7,
    	CURVE: CURVE$7,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$7,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$7,
    	SENSOR_TEMP: SENSOR_TEMP$7,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$7,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$7,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$7,
    	USE: USE$7,
    	DELETE: DELETE$7,
    	CREATE: CREATE$7,
    	CANCEL: CANCEL$7,
    	CURENT_STAT: CURENT_STAT$7
    };

    var english$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$7,
        ENABLE_SETTINGS: ENABLE_SETTINGS$7,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$7,
        USING: USING$7,
        DEFAULT: DEFAULT$7,
        PROFILE: PROFILE$7,
        CPU_BOOST: CPU_BOOST$7,
        CPU_BOOST_DESC: CPU_BOOST_DESC$7,
        SMT_DESC: SMT_DESC$7,
        CPU_NUM: CPU_NUM$7,
        CPU_NUM_DESC: CPU_NUM_DESC$7,
        TDP: TDP$7,
        TDP_DESC: TDP_DESC$7,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$7,
        WATTS: WATTS$7,
        GPU_FREQMODE: GPU_FREQMODE$7,
        UNLIMITED: UNLIMITED$7,
        FIXED_FREQ: FIXED_FREQ$7,
        RANGE_FREQ: RANGE_FREQ$7,
        AUTO_FREQ: AUTO_FREQ$7,
        GPU_FIX_FREQ: GPU_FIX_FREQ$7,
        GPU_MIN_FREQ: GPU_MIN_FREQ$7,
        GPU_MAX_FREQ: GPU_MAX_FREQ$7,
        FAN_SPEED: FAN_SPEED$7,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$7,
        GRID_ALIG: GRID_ALIG$7,
        FAN_MODE: FAN_MODE$7,
        NOT_CONTROLLED: NOT_CONTROLLED$7,
        FIXED: FIXED$7,
        CURVE: CURVE$7,
        SNAP_GRIDLINE: SNAP_GRIDLINE$7,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$7,
        SENSOR_TEMP: SENSOR_TEMP$7,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$7,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$7,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$7,
        USE: USE$7,
        DELETE: DELETE$7,
        CREATE: CREATE$7,
        CANCEL: CANCEL$7,
        CURENT_STAT: CURENT_STAT$7,
        'default': english
    });

    var TITEL_SETTINGS$6 = "Einstellungen";
    var ENABLE_SETTINGS$6 = "Einstellungen aktivieren";
    var USE_PERGAME_PROFILE$6 = "Spielspezifisches Profil";
    var USING$6 = "Verwendet";
    var DEFAULT$6 = " standard ";
    var PROFILE$6 = "Profil";
    var CPU_BOOST$6 = "CPU Boost";
    var CPU_BOOST_DESC$6 = "Maximale CPU Frequenz erhöhen";
    var SMT_DESC$6 = "Aktiviert ungerade CPU-Kerne";
    var CPU_NUM$6 = "Anzahl CPU-Kerne";
    var CPU_NUM_DESC$6 = "Anzahl physischer CPU-Kerne";
    var TDP$6 = "Maximale Verlustleistung (TDP)";
    var TDP_DESC$6 = "CPU-Leistung einschränken um Strom zu sparen";
    var RYZENADJ_NOT_FOUND$6 = "ryzenAdj nicht installiert";
    var WATTS$6 = "Watt";
    var GPU_FREQMODE$6 = "Grafikkartenfrequenz Modus";
    var UNLIMITED$6 = "Unbeschränkt";
    var FIXED_FREQ$6 = "fix";
    var RANGE_FREQ$6 = "Bereich";
    var AUTO_FREQ$6 = "Automatisch";
    var GPU_FIX_FREQ$6 = "Grafikkartenfrequenz";
    var GPU_MIN_FREQ$6 = "Minimale Frequenz";
    var GPU_MAX_FREQ$6 = "Maximale Frequenz";
    var FAN_SPEED$6 = "Lüftergeschwindigkeit";
    var CREATE_FAN_PROFILE$6 = "Lüfterprofil erstellen";
    var GRID_ALIG$6 = "Gitternetz Ausrichtung";
    var FAN_MODE$6 = "Lüftermodus";
    var NOT_CONTROLLED$6 = "Nicht kontrolliert";
    var FIXED$6 = "Fest";
    var CURVE$6 = "Kurve";
    var SNAP_GRIDLINE$6 = "An der Gitternetzlinien ausrichten";
    var FAN_SPEED_PERCENT$6 = "Prozentanteil der Lüftergeschwindigkeit";
    var SENSOR_TEMP$6 = "Temperatur des Sensors";
    var CREATE_FAN_PROFILE_TIP$6 = "Lüfterprofil erstellen";
    var SELECT_FAN_PROFILE_TIP$6 = "Wähle ein Lüfterprofil aus";
    var FAN_PROFILE_NAME$6 = "Name des Profils";
    var USE$6 = "Benutzen";
    var DELETE$6 = "Löschen";
    var CREATE$6 = "Erstellen";
    var CANCEL$6 = "Abbrechen";
    var CURENT_STAT$6 = "Aktueller Stand";
    var german = {
    	TITEL_SETTINGS: TITEL_SETTINGS$6,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$6,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$6,
    	USING: USING$6,
    	DEFAULT: DEFAULT$6,
    	PROFILE: PROFILE$6,
    	CPU_BOOST: CPU_BOOST$6,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$6,
    	SMT_DESC: SMT_DESC$6,
    	CPU_NUM: CPU_NUM$6,
    	CPU_NUM_DESC: CPU_NUM_DESC$6,
    	TDP: TDP$6,
    	TDP_DESC: TDP_DESC$6,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$6,
    	WATTS: WATTS$6,
    	GPU_FREQMODE: GPU_FREQMODE$6,
    	UNLIMITED: UNLIMITED$6,
    	FIXED_FREQ: FIXED_FREQ$6,
    	RANGE_FREQ: RANGE_FREQ$6,
    	AUTO_FREQ: AUTO_FREQ$6,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$6,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$6,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$6,
    	FAN_SPEED: FAN_SPEED$6,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$6,
    	GRID_ALIG: GRID_ALIG$6,
    	FAN_MODE: FAN_MODE$6,
    	NOT_CONTROLLED: NOT_CONTROLLED$6,
    	FIXED: FIXED$6,
    	CURVE: CURVE$6,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$6,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$6,
    	SENSOR_TEMP: SENSOR_TEMP$6,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$6,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$6,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$6,
    	USE: USE$6,
    	DELETE: DELETE$6,
    	CREATE: CREATE$6,
    	CANCEL: CANCEL$6,
    	CURENT_STAT: CURENT_STAT$6
    };

    var german$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$6,
        ENABLE_SETTINGS: ENABLE_SETTINGS$6,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$6,
        USING: USING$6,
        DEFAULT: DEFAULT$6,
        PROFILE: PROFILE$6,
        CPU_BOOST: CPU_BOOST$6,
        CPU_BOOST_DESC: CPU_BOOST_DESC$6,
        SMT_DESC: SMT_DESC$6,
        CPU_NUM: CPU_NUM$6,
        CPU_NUM_DESC: CPU_NUM_DESC$6,
        TDP: TDP$6,
        TDP_DESC: TDP_DESC$6,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$6,
        WATTS: WATTS$6,
        GPU_FREQMODE: GPU_FREQMODE$6,
        UNLIMITED: UNLIMITED$6,
        FIXED_FREQ: FIXED_FREQ$6,
        RANGE_FREQ: RANGE_FREQ$6,
        AUTO_FREQ: AUTO_FREQ$6,
        GPU_FIX_FREQ: GPU_FIX_FREQ$6,
        GPU_MIN_FREQ: GPU_MIN_FREQ$6,
        GPU_MAX_FREQ: GPU_MAX_FREQ$6,
        FAN_SPEED: FAN_SPEED$6,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$6,
        GRID_ALIG: GRID_ALIG$6,
        FAN_MODE: FAN_MODE$6,
        NOT_CONTROLLED: NOT_CONTROLLED$6,
        FIXED: FIXED$6,
        CURVE: CURVE$6,
        SNAP_GRIDLINE: SNAP_GRIDLINE$6,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$6,
        SENSOR_TEMP: SENSOR_TEMP$6,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$6,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$6,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$6,
        USE: USE$6,
        DELETE: DELETE$6,
        CREATE: CREATE$6,
        CANCEL: CANCEL$6,
        CURENT_STAT: CURENT_STAT$6,
        'default': german
    });

    var TITEL_SETTINGS$5 = "";
    var ENABLE_SETTINGS$5 = "";
    var USE_PERGAME_PROFILE$5 = "";
    var USING$5 = "";
    var DEFAULT$5 = "";
    var PROFILE$5 = "";
    var CPU_BOOST$5 = "";
    var CPU_BOOST_DESC$5 = "";
    var SMT_DESC$5 = "";
    var CPU_NUM$5 = "";
    var CPU_NUM_DESC$5 = "";
    var TDP$5 = "";
    var TDP_DESC$5 = "";
    var RYZENADJ_NOT_FOUND$5 = "";
    var WATTS$5 = "";
    var GPU_FREQMODE$5 = "";
    var UNLIMITED$5 = "";
    var FIXED_FREQ$5 = "";
    var RANGE_FREQ$5 = "";
    var AUTO_FREQ$5 = "";
    var GPU_FIX_FREQ$5 = "";
    var GPU_MIN_FREQ$5 = "";
    var GPU_MAX_FREQ$5 = "";
    var FAN_SPEED$5 = "";
    var CREATE_FAN_PROFILE$5 = "";
    var GRID_ALIG$5 = "";
    var FAN_MODE$5 = "";
    var NOT_CONTROLLED$5 = "";
    var FIXED$5 = "";
    var CURVE$5 = "";
    var SNAP_GRIDLINE$5 = "";
    var FAN_SPEED_PERCENT$5 = "";
    var SENSOR_TEMP$5 = "";
    var CREATE_FAN_PROFILE_TIP$5 = "";
    var SELECT_FAN_PROFILE_TIP$5 = "";
    var FAN_PROFILE_NAME$5 = "";
    var USE$5 = "";
    var DELETE$5 = "";
    var CREATE$5 = "";
    var CANCEL$5 = "";
    var CURENT_STAT$5 = "";
    var japanese = {
    	TITEL_SETTINGS: TITEL_SETTINGS$5,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$5,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$5,
    	USING: USING$5,
    	DEFAULT: DEFAULT$5,
    	PROFILE: PROFILE$5,
    	CPU_BOOST: CPU_BOOST$5,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$5,
    	SMT_DESC: SMT_DESC$5,
    	CPU_NUM: CPU_NUM$5,
    	CPU_NUM_DESC: CPU_NUM_DESC$5,
    	TDP: TDP$5,
    	TDP_DESC: TDP_DESC$5,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$5,
    	WATTS: WATTS$5,
    	GPU_FREQMODE: GPU_FREQMODE$5,
    	UNLIMITED: UNLIMITED$5,
    	FIXED_FREQ: FIXED_FREQ$5,
    	RANGE_FREQ: RANGE_FREQ$5,
    	AUTO_FREQ: AUTO_FREQ$5,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$5,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$5,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$5,
    	FAN_SPEED: FAN_SPEED$5,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$5,
    	GRID_ALIG: GRID_ALIG$5,
    	FAN_MODE: FAN_MODE$5,
    	NOT_CONTROLLED: NOT_CONTROLLED$5,
    	FIXED: FIXED$5,
    	CURVE: CURVE$5,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$5,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$5,
    	SENSOR_TEMP: SENSOR_TEMP$5,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$5,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$5,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$5,
    	USE: USE$5,
    	DELETE: DELETE$5,
    	CREATE: CREATE$5,
    	CANCEL: CANCEL$5,
    	CURENT_STAT: CURENT_STAT$5
    };

    var japanese$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$5,
        ENABLE_SETTINGS: ENABLE_SETTINGS$5,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$5,
        USING: USING$5,
        DEFAULT: DEFAULT$5,
        PROFILE: PROFILE$5,
        CPU_BOOST: CPU_BOOST$5,
        CPU_BOOST_DESC: CPU_BOOST_DESC$5,
        SMT_DESC: SMT_DESC$5,
        CPU_NUM: CPU_NUM$5,
        CPU_NUM_DESC: CPU_NUM_DESC$5,
        TDP: TDP$5,
        TDP_DESC: TDP_DESC$5,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$5,
        WATTS: WATTS$5,
        GPU_FREQMODE: GPU_FREQMODE$5,
        UNLIMITED: UNLIMITED$5,
        FIXED_FREQ: FIXED_FREQ$5,
        RANGE_FREQ: RANGE_FREQ$5,
        AUTO_FREQ: AUTO_FREQ$5,
        GPU_FIX_FREQ: GPU_FIX_FREQ$5,
        GPU_MIN_FREQ: GPU_MIN_FREQ$5,
        GPU_MAX_FREQ: GPU_MAX_FREQ$5,
        FAN_SPEED: FAN_SPEED$5,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$5,
        GRID_ALIG: GRID_ALIG$5,
        FAN_MODE: FAN_MODE$5,
        NOT_CONTROLLED: NOT_CONTROLLED$5,
        FIXED: FIXED$5,
        CURVE: CURVE$5,
        SNAP_GRIDLINE: SNAP_GRIDLINE$5,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$5,
        SENSOR_TEMP: SENSOR_TEMP$5,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$5,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$5,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$5,
        USE: USE$5,
        DELETE: DELETE$5,
        CREATE: CREATE$5,
        CANCEL: CANCEL$5,
        CURENT_STAT: CURENT_STAT$5,
        'default': japanese
    });

    var TITEL_SETTINGS$4 = "";
    var ENABLE_SETTINGS$4 = "";
    var USE_PERGAME_PROFILE$4 = "";
    var USING$4 = "";
    var DEFAULT$4 = "";
    var PROFILE$4 = "";
    var CPU_BOOST$4 = "";
    var CPU_BOOST_DESC$4 = "";
    var SMT_DESC$4 = "";
    var CPU_NUM$4 = "";
    var CPU_NUM_DESC$4 = "";
    var TDP$4 = "";
    var TDP_DESC$4 = "";
    var RYZENADJ_NOT_FOUND$4 = "";
    var WATTS$4 = "";
    var GPU_FREQMODE$4 = "";
    var UNLIMITED$4 = "";
    var FIXED_FREQ$4 = "";
    var RANGE_FREQ$4 = "";
    var AUTO_FREQ$4 = "";
    var GPU_FIX_FREQ$4 = "";
    var GPU_MIN_FREQ$4 = "";
    var GPU_MAX_FREQ$4 = "";
    var FAN_SPEED$4 = "";
    var CREATE_FAN_PROFILE$4 = "";
    var GRID_ALIG$4 = "";
    var FAN_MODE$4 = "";
    var NOT_CONTROLLED$4 = "";
    var FIXED$4 = "";
    var CURVE$4 = "";
    var SNAP_GRIDLINE$4 = "";
    var FAN_SPEED_PERCENT$4 = "";
    var SENSOR_TEMP$4 = "";
    var CREATE_FAN_PROFILE_TIP$4 = "";
    var SELECT_FAN_PROFILE_TIP$4 = "";
    var FAN_PROFILE_NAME$4 = "";
    var USE$4 = "";
    var DELETE$4 = "";
    var CREATE$4 = "";
    var CANCEL$4 = "";
    var CURENT_STAT$4 = "";
    var koreana = {
    	TITEL_SETTINGS: TITEL_SETTINGS$4,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$4,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$4,
    	USING: USING$4,
    	DEFAULT: DEFAULT$4,
    	PROFILE: PROFILE$4,
    	CPU_BOOST: CPU_BOOST$4,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$4,
    	SMT_DESC: SMT_DESC$4,
    	CPU_NUM: CPU_NUM$4,
    	CPU_NUM_DESC: CPU_NUM_DESC$4,
    	TDP: TDP$4,
    	TDP_DESC: TDP_DESC$4,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$4,
    	WATTS: WATTS$4,
    	GPU_FREQMODE: GPU_FREQMODE$4,
    	UNLIMITED: UNLIMITED$4,
    	FIXED_FREQ: FIXED_FREQ$4,
    	RANGE_FREQ: RANGE_FREQ$4,
    	AUTO_FREQ: AUTO_FREQ$4,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$4,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$4,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$4,
    	FAN_SPEED: FAN_SPEED$4,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$4,
    	GRID_ALIG: GRID_ALIG$4,
    	FAN_MODE: FAN_MODE$4,
    	NOT_CONTROLLED: NOT_CONTROLLED$4,
    	FIXED: FIXED$4,
    	CURVE: CURVE$4,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$4,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$4,
    	SENSOR_TEMP: SENSOR_TEMP$4,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$4,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$4,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$4,
    	USE: USE$4,
    	DELETE: DELETE$4,
    	CREATE: CREATE$4,
    	CANCEL: CANCEL$4,
    	CURENT_STAT: CURENT_STAT$4
    };

    var koreana$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$4,
        ENABLE_SETTINGS: ENABLE_SETTINGS$4,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$4,
        USING: USING$4,
        DEFAULT: DEFAULT$4,
        PROFILE: PROFILE$4,
        CPU_BOOST: CPU_BOOST$4,
        CPU_BOOST_DESC: CPU_BOOST_DESC$4,
        SMT_DESC: SMT_DESC$4,
        CPU_NUM: CPU_NUM$4,
        CPU_NUM_DESC: CPU_NUM_DESC$4,
        TDP: TDP$4,
        TDP_DESC: TDP_DESC$4,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$4,
        WATTS: WATTS$4,
        GPU_FREQMODE: GPU_FREQMODE$4,
        UNLIMITED: UNLIMITED$4,
        FIXED_FREQ: FIXED_FREQ$4,
        RANGE_FREQ: RANGE_FREQ$4,
        AUTO_FREQ: AUTO_FREQ$4,
        GPU_FIX_FREQ: GPU_FIX_FREQ$4,
        GPU_MIN_FREQ: GPU_MIN_FREQ$4,
        GPU_MAX_FREQ: GPU_MAX_FREQ$4,
        FAN_SPEED: FAN_SPEED$4,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$4,
        GRID_ALIG: GRID_ALIG$4,
        FAN_MODE: FAN_MODE$4,
        NOT_CONTROLLED: NOT_CONTROLLED$4,
        FIXED: FIXED$4,
        CURVE: CURVE$4,
        SNAP_GRIDLINE: SNAP_GRIDLINE$4,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$4,
        SENSOR_TEMP: SENSOR_TEMP$4,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$4,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$4,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$4,
        USE: USE$4,
        DELETE: DELETE$4,
        CREATE: CREATE$4,
        CANCEL: CANCEL$4,
        CURENT_STAT: CURENT_STAT$4,
        'default': koreana
    });

    var TITEL_SETTINGS$3 = "";
    var ENABLE_SETTINGS$3 = "";
    var USE_PERGAME_PROFILE$3 = "";
    var USING$3 = "";
    var DEFAULT$3 = "";
    var PROFILE$3 = "";
    var CPU_BOOST$3 = "";
    var CPU_BOOST_DESC$3 = "";
    var SMT_DESC$3 = "";
    var CPU_NUM$3 = "";
    var CPU_NUM_DESC$3 = "";
    var TDP$3 = "";
    var TDP_DESC$3 = "";
    var RYZENADJ_NOT_FOUND$3 = "";
    var WATTS$3 = "";
    var GPU_FREQMODE$3 = "";
    var UNLIMITED$3 = "";
    var FIXED_FREQ$3 = "";
    var RANGE_FREQ$3 = "";
    var AUTO_FREQ$3 = "";
    var GPU_FIX_FREQ$3 = "";
    var GPU_MIN_FREQ$3 = "";
    var GPU_MAX_FREQ$3 = "";
    var FAN_SPEED$3 = "";
    var CREATE_FAN_PROFILE$3 = "";
    var GRID_ALIG$3 = "";
    var FAN_MODE$3 = "";
    var NOT_CONTROLLED$3 = "";
    var FIXED$3 = "";
    var CURVE$3 = "";
    var SNAP_GRIDLINE$3 = "";
    var FAN_SPEED_PERCENT$3 = "";
    var SENSOR_TEMP$3 = "";
    var CREATE_FAN_PROFILE_TIP$3 = "";
    var SELECT_FAN_PROFILE_TIP$3 = "";
    var FAN_PROFILE_NAME$3 = "";
    var USE$3 = "";
    var DELETE$3 = "";
    var CREATE$3 = "";
    var CANCEL$3 = "";
    var CURENT_STAT$3 = "";
    var thai = {
    	TITEL_SETTINGS: TITEL_SETTINGS$3,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$3,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$3,
    	USING: USING$3,
    	DEFAULT: DEFAULT$3,
    	PROFILE: PROFILE$3,
    	CPU_BOOST: CPU_BOOST$3,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$3,
    	SMT_DESC: SMT_DESC$3,
    	CPU_NUM: CPU_NUM$3,
    	CPU_NUM_DESC: CPU_NUM_DESC$3,
    	TDP: TDP$3,
    	TDP_DESC: TDP_DESC$3,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$3,
    	WATTS: WATTS$3,
    	GPU_FREQMODE: GPU_FREQMODE$3,
    	UNLIMITED: UNLIMITED$3,
    	FIXED_FREQ: FIXED_FREQ$3,
    	RANGE_FREQ: RANGE_FREQ$3,
    	AUTO_FREQ: AUTO_FREQ$3,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$3,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$3,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$3,
    	FAN_SPEED: FAN_SPEED$3,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$3,
    	GRID_ALIG: GRID_ALIG$3,
    	FAN_MODE: FAN_MODE$3,
    	NOT_CONTROLLED: NOT_CONTROLLED$3,
    	FIXED: FIXED$3,
    	CURVE: CURVE$3,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$3,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$3,
    	SENSOR_TEMP: SENSOR_TEMP$3,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$3,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$3,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$3,
    	USE: USE$3,
    	DELETE: DELETE$3,
    	CREATE: CREATE$3,
    	CANCEL: CANCEL$3,
    	CURENT_STAT: CURENT_STAT$3
    };

    var thai$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$3,
        ENABLE_SETTINGS: ENABLE_SETTINGS$3,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$3,
        USING: USING$3,
        DEFAULT: DEFAULT$3,
        PROFILE: PROFILE$3,
        CPU_BOOST: CPU_BOOST$3,
        CPU_BOOST_DESC: CPU_BOOST_DESC$3,
        SMT_DESC: SMT_DESC$3,
        CPU_NUM: CPU_NUM$3,
        CPU_NUM_DESC: CPU_NUM_DESC$3,
        TDP: TDP$3,
        TDP_DESC: TDP_DESC$3,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$3,
        WATTS: WATTS$3,
        GPU_FREQMODE: GPU_FREQMODE$3,
        UNLIMITED: UNLIMITED$3,
        FIXED_FREQ: FIXED_FREQ$3,
        RANGE_FREQ: RANGE_FREQ$3,
        AUTO_FREQ: AUTO_FREQ$3,
        GPU_FIX_FREQ: GPU_FIX_FREQ$3,
        GPU_MIN_FREQ: GPU_MIN_FREQ$3,
        GPU_MAX_FREQ: GPU_MAX_FREQ$3,
        FAN_SPEED: FAN_SPEED$3,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$3,
        GRID_ALIG: GRID_ALIG$3,
        FAN_MODE: FAN_MODE$3,
        NOT_CONTROLLED: NOT_CONTROLLED$3,
        FIXED: FIXED$3,
        CURVE: CURVE$3,
        SNAP_GRIDLINE: SNAP_GRIDLINE$3,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$3,
        SENSOR_TEMP: SENSOR_TEMP$3,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$3,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$3,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$3,
        USE: USE$3,
        DELETE: DELETE$3,
        CREATE: CREATE$3,
        CANCEL: CANCEL$3,
        CURENT_STAT: CURENT_STAT$3,
        'default': thai
    });

    var TITEL_SETTINGS$2 = "";
    var ENABLE_SETTINGS$2 = "";
    var USE_PERGAME_PROFILE$2 = "";
    var USING$2 = "";
    var DEFAULT$2 = "";
    var PROFILE$2 = "";
    var CPU_BOOST$2 = "";
    var CPU_BOOST_DESC$2 = "";
    var SMT_DESC$2 = "";
    var CPU_NUM$2 = "";
    var CPU_NUM_DESC$2 = "";
    var TDP$2 = "";
    var TDP_DESC$2 = "";
    var RYZENADJ_NOT_FOUND$2 = "";
    var WATTS$2 = "";
    var GPU_FREQMODE$2 = "";
    var UNLIMITED$2 = "";
    var FIXED_FREQ$2 = "";
    var RANGE_FREQ$2 = "";
    var AUTO_FREQ$2 = "";
    var GPU_FIX_FREQ$2 = "";
    var GPU_MIN_FREQ$2 = "";
    var GPU_MAX_FREQ$2 = "";
    var FAN_SPEED$2 = "";
    var CREATE_FAN_PROFILE$2 = "";
    var GRID_ALIG$2 = "";
    var FAN_MODE$2 = "";
    var NOT_CONTROLLED$2 = "";
    var FIXED$2 = "";
    var CURVE$2 = "";
    var SNAP_GRIDLINE$2 = "";
    var FAN_SPEED_PERCENT$2 = "";
    var SENSOR_TEMP$2 = "";
    var CREATE_FAN_PROFILE_TIP$2 = "";
    var SELECT_FAN_PROFILE_TIP$2 = "";
    var FAN_PROFILE_NAME$2 = "";
    var USE$2 = "";
    var DELETE$2 = "";
    var CREATE$2 = "";
    var CANCEL$2 = "";
    var CURENT_STAT$2 = "";
    var bulgarian = {
    	TITEL_SETTINGS: TITEL_SETTINGS$2,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$2,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$2,
    	USING: USING$2,
    	DEFAULT: DEFAULT$2,
    	PROFILE: PROFILE$2,
    	CPU_BOOST: CPU_BOOST$2,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$2,
    	SMT_DESC: SMT_DESC$2,
    	CPU_NUM: CPU_NUM$2,
    	CPU_NUM_DESC: CPU_NUM_DESC$2,
    	TDP: TDP$2,
    	TDP_DESC: TDP_DESC$2,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$2,
    	WATTS: WATTS$2,
    	GPU_FREQMODE: GPU_FREQMODE$2,
    	UNLIMITED: UNLIMITED$2,
    	FIXED_FREQ: FIXED_FREQ$2,
    	RANGE_FREQ: RANGE_FREQ$2,
    	AUTO_FREQ: AUTO_FREQ$2,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$2,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$2,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$2,
    	FAN_SPEED: FAN_SPEED$2,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$2,
    	GRID_ALIG: GRID_ALIG$2,
    	FAN_MODE: FAN_MODE$2,
    	NOT_CONTROLLED: NOT_CONTROLLED$2,
    	FIXED: FIXED$2,
    	CURVE: CURVE$2,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$2,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$2,
    	SENSOR_TEMP: SENSOR_TEMP$2,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$2,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$2,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$2,
    	USE: USE$2,
    	DELETE: DELETE$2,
    	CREATE: CREATE$2,
    	CANCEL: CANCEL$2,
    	CURENT_STAT: CURENT_STAT$2
    };

    var bulgarian$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$2,
        ENABLE_SETTINGS: ENABLE_SETTINGS$2,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$2,
        USING: USING$2,
        DEFAULT: DEFAULT$2,
        PROFILE: PROFILE$2,
        CPU_BOOST: CPU_BOOST$2,
        CPU_BOOST_DESC: CPU_BOOST_DESC$2,
        SMT_DESC: SMT_DESC$2,
        CPU_NUM: CPU_NUM$2,
        CPU_NUM_DESC: CPU_NUM_DESC$2,
        TDP: TDP$2,
        TDP_DESC: TDP_DESC$2,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$2,
        WATTS: WATTS$2,
        GPU_FREQMODE: GPU_FREQMODE$2,
        UNLIMITED: UNLIMITED$2,
        FIXED_FREQ: FIXED_FREQ$2,
        RANGE_FREQ: RANGE_FREQ$2,
        AUTO_FREQ: AUTO_FREQ$2,
        GPU_FIX_FREQ: GPU_FIX_FREQ$2,
        GPU_MIN_FREQ: GPU_MIN_FREQ$2,
        GPU_MAX_FREQ: GPU_MAX_FREQ$2,
        FAN_SPEED: FAN_SPEED$2,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$2,
        GRID_ALIG: GRID_ALIG$2,
        FAN_MODE: FAN_MODE$2,
        NOT_CONTROLLED: NOT_CONTROLLED$2,
        FIXED: FIXED$2,
        CURVE: CURVE$2,
        SNAP_GRIDLINE: SNAP_GRIDLINE$2,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$2,
        SENSOR_TEMP: SENSOR_TEMP$2,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$2,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$2,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$2,
        USE: USE$2,
        DELETE: DELETE$2,
        CREATE: CREATE$2,
        CANCEL: CANCEL$2,
        CURENT_STAT: CURENT_STAT$2,
        'default': bulgarian
    });

    var TITEL_SETTINGS$1 = "";
    var ENABLE_SETTINGS$1 = "";
    var USE_PERGAME_PROFILE$1 = "";
    var USING$1 = "";
    var DEFAULT$1 = "";
    var PROFILE$1 = "";
    var CPU_BOOST$1 = "";
    var CPU_BOOST_DESC$1 = "";
    var SMT_DESC$1 = "";
    var CPU_NUM$1 = "";
    var CPU_NUM_DESC$1 = "";
    var TDP$1 = "";
    var TDP_DESC$1 = "";
    var RYZENADJ_NOT_FOUND$1 = "";
    var WATTS$1 = "";
    var GPU_FREQMODE$1 = "";
    var UNLIMITED$1 = "";
    var FIXED_FREQ$1 = "";
    var RANGE_FREQ$1 = "";
    var AUTO_FREQ$1 = "";
    var GPU_FIX_FREQ$1 = "";
    var GPU_MIN_FREQ$1 = "";
    var GPU_MAX_FREQ$1 = "";
    var FAN_SPEED$1 = "";
    var CREATE_FAN_PROFILE$1 = "";
    var GRID_ALIG$1 = "";
    var FAN_MODE$1 = "";
    var NOT_CONTROLLED$1 = "";
    var FIXED$1 = "";
    var CURVE$1 = "";
    var SNAP_GRIDLINE$1 = "";
    var FAN_SPEED_PERCENT$1 = "";
    var SENSOR_TEMP$1 = "";
    var CREATE_FAN_PROFILE_TIP$1 = "";
    var SELECT_FAN_PROFILE_TIP$1 = "";
    var FAN_PROFILE_NAME$1 = "";
    var USE$1 = "";
    var DELETE$1 = "";
    var CREATE$1 = "";
    var CANCEL$1 = "";
    var CURENT_STAT$1 = "";
    var italian = {
    	TITEL_SETTINGS: TITEL_SETTINGS$1,
    	ENABLE_SETTINGS: ENABLE_SETTINGS$1,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$1,
    	USING: USING$1,
    	DEFAULT: DEFAULT$1,
    	PROFILE: PROFILE$1,
    	CPU_BOOST: CPU_BOOST$1,
    	CPU_BOOST_DESC: CPU_BOOST_DESC$1,
    	SMT_DESC: SMT_DESC$1,
    	CPU_NUM: CPU_NUM$1,
    	CPU_NUM_DESC: CPU_NUM_DESC$1,
    	TDP: TDP$1,
    	TDP_DESC: TDP_DESC$1,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$1,
    	WATTS: WATTS$1,
    	GPU_FREQMODE: GPU_FREQMODE$1,
    	UNLIMITED: UNLIMITED$1,
    	FIXED_FREQ: FIXED_FREQ$1,
    	RANGE_FREQ: RANGE_FREQ$1,
    	AUTO_FREQ: AUTO_FREQ$1,
    	GPU_FIX_FREQ: GPU_FIX_FREQ$1,
    	GPU_MIN_FREQ: GPU_MIN_FREQ$1,
    	GPU_MAX_FREQ: GPU_MAX_FREQ$1,
    	FAN_SPEED: FAN_SPEED$1,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$1,
    	GRID_ALIG: GRID_ALIG$1,
    	FAN_MODE: FAN_MODE$1,
    	NOT_CONTROLLED: NOT_CONTROLLED$1,
    	FIXED: FIXED$1,
    	CURVE: CURVE$1,
    	SNAP_GRIDLINE: SNAP_GRIDLINE$1,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$1,
    	SENSOR_TEMP: SENSOR_TEMP$1,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$1,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$1,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME$1,
    	USE: USE$1,
    	DELETE: DELETE$1,
    	CREATE: CREATE$1,
    	CANCEL: CANCEL$1,
    	CURENT_STAT: CURENT_STAT$1
    };

    var italian$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS$1,
        ENABLE_SETTINGS: ENABLE_SETTINGS$1,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE$1,
        USING: USING$1,
        DEFAULT: DEFAULT$1,
        PROFILE: PROFILE$1,
        CPU_BOOST: CPU_BOOST$1,
        CPU_BOOST_DESC: CPU_BOOST_DESC$1,
        SMT_DESC: SMT_DESC$1,
        CPU_NUM: CPU_NUM$1,
        CPU_NUM_DESC: CPU_NUM_DESC$1,
        TDP: TDP$1,
        TDP_DESC: TDP_DESC$1,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND$1,
        WATTS: WATTS$1,
        GPU_FREQMODE: GPU_FREQMODE$1,
        UNLIMITED: UNLIMITED$1,
        FIXED_FREQ: FIXED_FREQ$1,
        RANGE_FREQ: RANGE_FREQ$1,
        AUTO_FREQ: AUTO_FREQ$1,
        GPU_FIX_FREQ: GPU_FIX_FREQ$1,
        GPU_MIN_FREQ: GPU_MIN_FREQ$1,
        GPU_MAX_FREQ: GPU_MAX_FREQ$1,
        FAN_SPEED: FAN_SPEED$1,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE$1,
        GRID_ALIG: GRID_ALIG$1,
        FAN_MODE: FAN_MODE$1,
        NOT_CONTROLLED: NOT_CONTROLLED$1,
        FIXED: FIXED$1,
        CURVE: CURVE$1,
        SNAP_GRIDLINE: SNAP_GRIDLINE$1,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT$1,
        SENSOR_TEMP: SENSOR_TEMP$1,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP$1,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP$1,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME$1,
        USE: USE$1,
        DELETE: DELETE$1,
        CREATE: CREATE$1,
        CANCEL: CANCEL$1,
        CURENT_STAT: CURENT_STAT$1,
        'default': italian
    });

    var TITEL_SETTINGS = "";
    var ENABLE_SETTINGS = "";
    var USE_PERGAME_PROFILE = "";
    var USING = "";
    var DEFAULT = "";
    var PROFILE = "";
    var CPU_BOOST = "";
    var CPU_BOOST_DESC = "";
    var SMT_DESC = "";
    var CPU_NUM = "";
    var CPU_NUM_DESC = "";
    var TDP = "";
    var TDP_DESC = "";
    var RYZENADJ_NOT_FOUND = "";
    var WATTS = "";
    var GPU_FREQMODE = "";
    var UNLIMITED = "";
    var FIXED_FREQ = "";
    var RANGE_FREQ = "";
    var AUTO_FREQ = "";
    var GPU_FIX_FREQ = "";
    var GPU_MIN_FREQ = "";
    var GPU_MAX_FREQ = "";
    var FAN_SPEED = "";
    var CREATE_FAN_PROFILE = "";
    var GRID_ALIG = "";
    var FAN_MODE = "";
    var NOT_CONTROLLED = "";
    var FIXED = "";
    var CURVE = "";
    var SNAP_GRIDLINE = "";
    var FAN_SPEED_PERCENT = "";
    var SENSOR_TEMP = "";
    var CREATE_FAN_PROFILE_TIP = "";
    var SELECT_FAN_PROFILE_TIP = "";
    var FAN_PROFILE_NAME = "";
    var USE = "";
    var DELETE = "";
    var CREATE = "";
    var CANCEL = "";
    var CURENT_STAT = "";
    var french = {
    	TITEL_SETTINGS: TITEL_SETTINGS,
    	ENABLE_SETTINGS: ENABLE_SETTINGS,
    	USE_PERGAME_PROFILE: USE_PERGAME_PROFILE,
    	USING: USING,
    	DEFAULT: DEFAULT,
    	PROFILE: PROFILE,
    	CPU_BOOST: CPU_BOOST,
    	CPU_BOOST_DESC: CPU_BOOST_DESC,
    	SMT_DESC: SMT_DESC,
    	CPU_NUM: CPU_NUM,
    	CPU_NUM_DESC: CPU_NUM_DESC,
    	TDP: TDP,
    	TDP_DESC: TDP_DESC,
    	RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND,
    	WATTS: WATTS,
    	GPU_FREQMODE: GPU_FREQMODE,
    	UNLIMITED: UNLIMITED,
    	FIXED_FREQ: FIXED_FREQ,
    	RANGE_FREQ: RANGE_FREQ,
    	AUTO_FREQ: AUTO_FREQ,
    	GPU_FIX_FREQ: GPU_FIX_FREQ,
    	GPU_MIN_FREQ: GPU_MIN_FREQ,
    	GPU_MAX_FREQ: GPU_MAX_FREQ,
    	FAN_SPEED: FAN_SPEED,
    	CREATE_FAN_PROFILE: CREATE_FAN_PROFILE,
    	GRID_ALIG: GRID_ALIG,
    	FAN_MODE: FAN_MODE,
    	NOT_CONTROLLED: NOT_CONTROLLED,
    	FIXED: FIXED,
    	CURVE: CURVE,
    	SNAP_GRIDLINE: SNAP_GRIDLINE,
    	FAN_SPEED_PERCENT: FAN_SPEED_PERCENT,
    	SENSOR_TEMP: SENSOR_TEMP,
    	CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP,
    	SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP,
    	FAN_PROFILE_NAME: FAN_PROFILE_NAME,
    	USE: USE,
    	DELETE: DELETE,
    	CREATE: CREATE,
    	CANCEL: CANCEL,
    	CURENT_STAT: CURENT_STAT
    };

    var french$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TITEL_SETTINGS: TITEL_SETTINGS,
        ENABLE_SETTINGS: ENABLE_SETTINGS,
        USE_PERGAME_PROFILE: USE_PERGAME_PROFILE,
        USING: USING,
        DEFAULT: DEFAULT,
        PROFILE: PROFILE,
        CPU_BOOST: CPU_BOOST,
        CPU_BOOST_DESC: CPU_BOOST_DESC,
        SMT_DESC: SMT_DESC,
        CPU_NUM: CPU_NUM,
        CPU_NUM_DESC: CPU_NUM_DESC,
        TDP: TDP,
        TDP_DESC: TDP_DESC,
        RYZENADJ_NOT_FOUND: RYZENADJ_NOT_FOUND,
        WATTS: WATTS,
        GPU_FREQMODE: GPU_FREQMODE,
        UNLIMITED: UNLIMITED,
        FIXED_FREQ: FIXED_FREQ,
        RANGE_FREQ: RANGE_FREQ,
        AUTO_FREQ: AUTO_FREQ,
        GPU_FIX_FREQ: GPU_FIX_FREQ,
        GPU_MIN_FREQ: GPU_MIN_FREQ,
        GPU_MAX_FREQ: GPU_MAX_FREQ,
        FAN_SPEED: FAN_SPEED,
        CREATE_FAN_PROFILE: CREATE_FAN_PROFILE,
        GRID_ALIG: GRID_ALIG,
        FAN_MODE: FAN_MODE,
        NOT_CONTROLLED: NOT_CONTROLLED,
        FIXED: FIXED,
        CURVE: CURVE,
        SNAP_GRIDLINE: SNAP_GRIDLINE,
        FAN_SPEED_PERCENT: FAN_SPEED_PERCENT,
        SENSOR_TEMP: SENSOR_TEMP,
        CREATE_FAN_PROFILE_TIP: CREATE_FAN_PROFILE_TIP,
        SELECT_FAN_PROFILE_TIP: SELECT_FAN_PROFILE_TIP,
        FAN_PROFILE_NAME: FAN_PROFILE_NAME,
        USE: USE,
        DELETE: DELETE,
        CREATE: CREATE,
        CANCEL: CANCEL,
        CURENT_STAT: CURENT_STAT,
        'default': french
    });

    const localizeMap = {
        schinese: {
            label: '简体中文',
            strings: schinese$1,
            credit: ["yxx"],
        },
        tchinese: {
            label: '繁體中文',
            strings: tchinese$1,
            credit: [],
        },
        english: {
            label: 'English',
            strings: english$1,
            credit: [],
        },
        german: {
            label: 'Deutsch',
            strings: german$1,
            credit: ["dctr"],
        },
        japanese: {
            label: '日本語',
            strings: japanese$1,
            credit: [],
        },
        koreana: {
            label: '한국어',
            strings: koreana$1,
            credit: [],
        },
        thai: {
            label: 'ไทย',
            strings: thai$1,
            credit: [],
        },
        bulgarian: {
            label: 'Български',
            strings: bulgarian$1,
            credit: [],
        },
        italian: {
            label: 'Italiano',
            strings: italian$1,
            credit: [],
        },
        french: {
            label: 'Français',
            strings: french$1,
            credit: [],
        },
    };
    var localizeStrEnum;
    (function (localizeStrEnum) {
        localizeStrEnum["TITEL_SETTINGS"] = "TITEL_SETTINGS";
        localizeStrEnum["ENABLE_SETTINGS"] = "ENABLE_SETTINGS";
        localizeStrEnum["USE_PERGAME_PROFILE"] = "USE_PERGAME_PROFILE";
        localizeStrEnum["USING"] = "USING";
        localizeStrEnum["DEFAULT"] = "DEFAULT";
        localizeStrEnum["PROFILE"] = "PROFILE";
        localizeStrEnum["CPU_BOOST"] = "CPU_BOOST";
        localizeStrEnum["CPU_BOOST_DESC"] = "CPU_BOOST_DESC";
        localizeStrEnum["SMT_DESC"] = "SMT_DESC";
        localizeStrEnum["CPU_NUM"] = "CPU_NUM";
        localizeStrEnum["CPU_NUM_DESC"] = "CPU_NUM_DESC";
        localizeStrEnum["TDP"] = "TDP";
        localizeStrEnum["TDP_DESC"] = "TDP_DESC";
        localizeStrEnum["RYZENADJ_NOT_FOUND"] = "RYZENADJ_NOT_FOUND";
        localizeStrEnum["WATTS"] = "WATTS";
        localizeStrEnum["GPU_FREQMODE"] = "GPU_FREQMODE";
        localizeStrEnum["UNLIMITED"] = "UNLIMITED";
        localizeStrEnum["FIXED_FREQ"] = "FIXED_FREQ";
        localizeStrEnum["RANGE_FREQ"] = "RANGE_FREQ";
        localizeStrEnum["AUTO_FREQ"] = "AUTO_FREQ";
        localizeStrEnum["GPU_FIX_FREQ"] = "GPU_FIX_FREQ";
        localizeStrEnum["GPU_MIN_FREQ"] = "GPU_MIN_FREQ";
        localizeStrEnum["GPU_MAX_FREQ"] = "GPU_MAX_FREQ";
        localizeStrEnum["FAN_SPEED"] = "FAN_SPEED";
        localizeStrEnum["CREATE_FAN_PROFILE"] = "CREATE_FAN_PROFILE";
        localizeStrEnum["GRID_ALIG"] = "GRID_ALIG";
        localizeStrEnum["FAN_MODE"] = "FAN_MODE";
        localizeStrEnum["NOT_CONTROLLED"] = "NOT_CONTROLLED";
        localizeStrEnum["FIXED"] = "FIXED";
        localizeStrEnum["CURVE"] = "CURVE";
        localizeStrEnum["SNAP_GRIDLINE"] = "SNAP_GRIDLINE";
        localizeStrEnum["FAN_SPEED_PERCENT"] = "FAN_SPEED_PERCENT";
        localizeStrEnum["SENSOR_TEMP"] = "SENSOR_TEMP";
        localizeStrEnum["CREATE_FAN_PROFILE_TIP"] = "CREATE_FAN_PROFILE_TIP";
        localizeStrEnum["SELECT_FAN_PROFILE_TIP"] = "SELECT_FAN_PROFILE_TIP";
        localizeStrEnum["FAN_PROFILE_NAME"] = "FAN_PROFILE_NAME";
        localizeStrEnum["USE"] = "USE";
        localizeStrEnum["DELETE"] = "DELETE";
        localizeStrEnum["CREATE"] = "CREATE";
        localizeStrEnum["CANCEL"] = "CANCEL";
        localizeStrEnum["CURENT_STAT"] = "CURENT_STAT";
    })(localizeStrEnum || (localizeStrEnum = {}));

    class localizationManager {
        //private has_language  = false
        static async init(serverAPI) {
            await serverAPI.callPluginMethod("get_language", {}).then(res => {
                if (res.success) {
                    //console.log("language = " + res.result);
                    this.language = res.result;
                    //this.has_language = true;
                }
            });
        }
        static getString(defaultString) {
            var str = localizeMap[this.language]?.strings?.[defaultString] ?? localizeMap["english"]?.strings?.[defaultString];
            return str == "" ? localizeMap["english"]?.strings?.[defaultString] : str;
        }
    }
    localizationManager.language = "english";

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /*! *****************************************************************************
    Copyright (C) Microsoft. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var Reflect$1;
    (function (Reflect) {
        // Metadata Proposal
        // https://rbuckton.github.io/reflect-metadata/
        (function (factory) {
            var root = typeof commonjsGlobal === "object" ? commonjsGlobal :
                typeof self === "object" ? self :
                    typeof this === "object" ? this :
                        Function("return this;")();
            var exporter = makeExporter(Reflect);
            if (typeof root.Reflect === "undefined") {
                root.Reflect = Reflect;
            }
            else {
                exporter = makeExporter(root.Reflect, exporter);
            }
            factory(exporter);
            function makeExporter(target, previous) {
                return function (key, value) {
                    if (typeof target[key] !== "function") {
                        Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                    }
                    if (previous)
                        previous(key, value);
                };
            }
        })(function (exporter) {
            var hasOwn = Object.prototype.hasOwnProperty;
            // feature test for Symbol support
            var supportsSymbol = typeof Symbol === "function";
            var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
            var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
            var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
            var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
            var downLevel = !supportsCreate && !supportsProto;
            var HashMap = {
                // create an object in dictionary mode (a.k.a. "slow" mode in v8)
                create: supportsCreate
                    ? function () { return MakeDictionary(Object.create(null)); }
                    : supportsProto
                        ? function () { return MakeDictionary({ __proto__: null }); }
                        : function () { return MakeDictionary({}); },
                has: downLevel
                    ? function (map, key) { return hasOwn.call(map, key); }
                    : function (map, key) { return key in map; },
                get: downLevel
                    ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
                    : function (map, key) { return map[key]; },
            };
            // Load global or shim versions of Map, Set, and WeakMap
            var functionPrototype = Object.getPrototypeOf(Function);
            var usePolyfill = typeof process === "object" && process.env && process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
            var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
            var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
            var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
            // [[Metadata]] internal slot
            // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
            var Metadata = new _WeakMap();
            /**
             * Applies a set of decorators to a property of a target object.
             * @param decorators An array of decorators.
             * @param target The target object.
             * @param propertyKey (Optional) The property key to decorate.
             * @param attributes (Optional) The property descriptor for the target key.
             * @remarks Decorators are applied in reverse order.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     Example = Reflect.decorate(decoratorsArray, Example);
             *
             *     // property (on constructor)
             *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
             *
             *     // property (on prototype)
             *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
             *
             *     // method (on constructor)
             *     Object.defineProperty(Example, "staticMethod",
             *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
             *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
             *
             *     // method (on prototype)
             *     Object.defineProperty(Example.prototype, "method",
             *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
             *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
             *
             */
            function decorate(decorators, target, propertyKey, attributes) {
                if (!IsUndefined(propertyKey)) {
                    if (!IsArray(decorators))
                        throw new TypeError();
                    if (!IsObject(target))
                        throw new TypeError();
                    if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                        throw new TypeError();
                    if (IsNull(attributes))
                        attributes = undefined;
                    propertyKey = ToPropertyKey(propertyKey);
                    return DecorateProperty(decorators, target, propertyKey, attributes);
                }
                else {
                    if (!IsArray(decorators))
                        throw new TypeError();
                    if (!IsConstructor(target))
                        throw new TypeError();
                    return DecorateConstructor(decorators, target);
                }
            }
            exporter("decorate", decorate);
            // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
            // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
            /**
             * A default metadata decorator factory that can be used on a class, class member, or parameter.
             * @param metadataKey The key for the metadata entry.
             * @param metadataValue The value for the metadata entry.
             * @returns A decorator function.
             * @remarks
             * If `metadataKey` is already defined for the target and target key, the
             * metadataValue for that key will be overwritten.
             * @example
             *
             *     // constructor
             *     @Reflect.metadata(key, value)
             *     class Example {
             *     }
             *
             *     // property (on constructor, TypeScript only)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         static staticProperty;
             *     }
             *
             *     // property (on prototype, TypeScript only)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         property;
             *     }
             *
             *     // method (on constructor)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         static staticMethod() { }
             *     }
             *
             *     // method (on prototype)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         method() { }
             *     }
             *
             */
            function metadata(metadataKey, metadataValue) {
                function decorator(target, propertyKey) {
                    if (!IsObject(target))
                        throw new TypeError();
                    if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                        throw new TypeError();
                    OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
                }
                return decorator;
            }
            exporter("metadata", metadata);
            /**
             * Define a unique metadata entry on the target.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param metadataValue A value that contains attached metadata.
             * @param target The target object on which to define metadata.
             * @param propertyKey (Optional) The property key for the target.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     Reflect.defineMetadata("custom:annotation", options, Example);
             *
             *     // property (on constructor)
             *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
             *
             *     // property (on prototype)
             *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
             *
             *     // method (on constructor)
             *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
             *
             *     // method (on prototype)
             *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
             *
             *     // decorator factory as metadata-producing annotation.
             *     function MyAnnotation(options): Decorator {
             *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
             *     }
             *
             */
            function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            exporter("defineMetadata", defineMetadata);
            /**
             * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.hasMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function hasMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryHasMetadata(metadataKey, target, propertyKey);
            }
            exporter("hasMetadata", hasMetadata);
            /**
             * Gets a value indicating whether the target object has the provided metadata key defined.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function hasOwnMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
            }
            exporter("hasOwnMetadata", hasOwnMetadata);
            /**
             * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function getMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryGetMetadata(metadataKey, target, propertyKey);
            }
            exporter("getMetadata", getMetadata);
            /**
             * Gets the metadata value for the provided metadata key on the target object.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getOwnMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function getOwnMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
            }
            exporter("getOwnMetadata", getOwnMetadata);
            /**
             * Gets the metadata keys defined on the target object or its prototype chain.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns An array of unique metadata keys.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getMetadataKeys(Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getMetadataKeys(Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getMetadataKeys(Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getMetadataKeys(Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getMetadataKeys(Example.prototype, "method");
             *
             */
            function getMetadataKeys(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryMetadataKeys(target, propertyKey);
            }
            exporter("getMetadataKeys", getMetadataKeys);
            /**
             * Gets the unique metadata keys defined on the target object.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns An array of unique metadata keys.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getOwnMetadataKeys(Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
             *
             */
            function getOwnMetadataKeys(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryOwnMetadataKeys(target, propertyKey);
            }
            exporter("getOwnMetadataKeys", getOwnMetadataKeys);
            /**
             * Deletes the metadata entry from the target object with the provided key.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata entry was found and deleted; otherwise, false.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.deleteMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function deleteMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                var metadataMap = GetOrCreateMetadataMap(target, propertyKey, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                if (!metadataMap.delete(metadataKey))
                    return false;
                if (metadataMap.size > 0)
                    return true;
                var targetMetadata = Metadata.get(target);
                targetMetadata.delete(propertyKey);
                if (targetMetadata.size > 0)
                    return true;
                Metadata.delete(target);
                return true;
            }
            exporter("deleteMetadata", deleteMetadata);
            function DecorateConstructor(decorators, target) {
                for (var i = decorators.length - 1; i >= 0; --i) {
                    var decorator = decorators[i];
                    var decorated = decorator(target);
                    if (!IsUndefined(decorated) && !IsNull(decorated)) {
                        if (!IsConstructor(decorated))
                            throw new TypeError();
                        target = decorated;
                    }
                }
                return target;
            }
            function DecorateProperty(decorators, target, propertyKey, descriptor) {
                for (var i = decorators.length - 1; i >= 0; --i) {
                    var decorator = decorators[i];
                    var decorated = decorator(target, propertyKey, descriptor);
                    if (!IsUndefined(decorated) && !IsNull(decorated)) {
                        if (!IsObject(decorated))
                            throw new TypeError();
                        descriptor = decorated;
                    }
                }
                return descriptor;
            }
            function GetOrCreateMetadataMap(O, P, Create) {
                var targetMetadata = Metadata.get(O);
                if (IsUndefined(targetMetadata)) {
                    if (!Create)
                        return undefined;
                    targetMetadata = new _Map();
                    Metadata.set(O, targetMetadata);
                }
                var metadataMap = targetMetadata.get(P);
                if (IsUndefined(metadataMap)) {
                    if (!Create)
                        return undefined;
                    metadataMap = new _Map();
                    targetMetadata.set(P, metadataMap);
                }
                return metadataMap;
            }
            // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
            function OrdinaryHasMetadata(MetadataKey, O, P) {
                var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
                if (hasOwn)
                    return true;
                var parent = OrdinaryGetPrototypeOf(O);
                if (!IsNull(parent))
                    return OrdinaryHasMetadata(MetadataKey, parent, P);
                return false;
            }
            // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
            function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                return ToBoolean(metadataMap.has(MetadataKey));
            }
            // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
            function OrdinaryGetMetadata(MetadataKey, O, P) {
                var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
                if (hasOwn)
                    return OrdinaryGetOwnMetadata(MetadataKey, O, P);
                var parent = OrdinaryGetPrototypeOf(O);
                if (!IsNull(parent))
                    return OrdinaryGetMetadata(MetadataKey, parent, P);
                return undefined;
            }
            // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
            function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return undefined;
                return metadataMap.get(MetadataKey);
            }
            // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
            function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
                metadataMap.set(MetadataKey, MetadataValue);
            }
            // 3.1.6.1 OrdinaryMetadataKeys(O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
            function OrdinaryMetadataKeys(O, P) {
                var ownKeys = OrdinaryOwnMetadataKeys(O, P);
                var parent = OrdinaryGetPrototypeOf(O);
                if (parent === null)
                    return ownKeys;
                var parentKeys = OrdinaryMetadataKeys(parent, P);
                if (parentKeys.length <= 0)
                    return ownKeys;
                if (ownKeys.length <= 0)
                    return parentKeys;
                var set = new _Set();
                var keys = [];
                for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                    var key = ownKeys_1[_i];
                    var hasKey = set.has(key);
                    if (!hasKey) {
                        set.add(key);
                        keys.push(key);
                    }
                }
                for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                    var key = parentKeys_1[_a];
                    var hasKey = set.has(key);
                    if (!hasKey) {
                        set.add(key);
                        keys.push(key);
                    }
                }
                return keys;
            }
            // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
            function OrdinaryOwnMetadataKeys(O, P) {
                var keys = [];
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return keys;
                var keysObj = metadataMap.keys();
                var iterator = GetIterator(keysObj);
                var k = 0;
                while (true) {
                    var next = IteratorStep(iterator);
                    if (!next) {
                        keys.length = k;
                        return keys;
                    }
                    var nextValue = IteratorValue(next);
                    try {
                        keys[k] = nextValue;
                    }
                    catch (e) {
                        try {
                            IteratorClose(iterator);
                        }
                        finally {
                            throw e;
                        }
                    }
                    k++;
                }
            }
            // 6 ECMAScript Data Typ0es and Values
            // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
            function Type(x) {
                if (x === null)
                    return 1 /* Null */;
                switch (typeof x) {
                    case "undefined": return 0 /* Undefined */;
                    case "boolean": return 2 /* Boolean */;
                    case "string": return 3 /* String */;
                    case "symbol": return 4 /* Symbol */;
                    case "number": return 5 /* Number */;
                    case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
                    default: return 6 /* Object */;
                }
            }
            // 6.1.1 The Undefined Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
            function IsUndefined(x) {
                return x === undefined;
            }
            // 6.1.2 The Null Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
            function IsNull(x) {
                return x === null;
            }
            // 6.1.5 The Symbol Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
            function IsSymbol(x) {
                return typeof x === "symbol";
            }
            // 6.1.7 The Object Type
            // https://tc39.github.io/ecma262/#sec-object-type
            function IsObject(x) {
                return typeof x === "object" ? x !== null : typeof x === "function";
            }
            // 7.1 Type Conversion
            // https://tc39.github.io/ecma262/#sec-type-conversion
            // 7.1.1 ToPrimitive(input [, PreferredType])
            // https://tc39.github.io/ecma262/#sec-toprimitive
            function ToPrimitive(input, PreferredType) {
                switch (Type(input)) {
                    case 0 /* Undefined */: return input;
                    case 1 /* Null */: return input;
                    case 2 /* Boolean */: return input;
                    case 3 /* String */: return input;
                    case 4 /* Symbol */: return input;
                    case 5 /* Number */: return input;
                }
                var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
                var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
                if (exoticToPrim !== undefined) {
                    var result = exoticToPrim.call(input, hint);
                    if (IsObject(result))
                        throw new TypeError();
                    return result;
                }
                return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
            }
            // 7.1.1.1 OrdinaryToPrimitive(O, hint)
            // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
            function OrdinaryToPrimitive(O, hint) {
                if (hint === "string") {
                    var toString_1 = O.toString;
                    if (IsCallable(toString_1)) {
                        var result = toString_1.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                    var valueOf = O.valueOf;
                    if (IsCallable(valueOf)) {
                        var result = valueOf.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                }
                else {
                    var valueOf = O.valueOf;
                    if (IsCallable(valueOf)) {
                        var result = valueOf.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                    var toString_2 = O.toString;
                    if (IsCallable(toString_2)) {
                        var result = toString_2.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                }
                throw new TypeError();
            }
            // 7.1.2 ToBoolean(argument)
            // https://tc39.github.io/ecma262/2016/#sec-toboolean
            function ToBoolean(argument) {
                return !!argument;
            }
            // 7.1.12 ToString(argument)
            // https://tc39.github.io/ecma262/#sec-tostring
            function ToString(argument) {
                return "" + argument;
            }
            // 7.1.14 ToPropertyKey(argument)
            // https://tc39.github.io/ecma262/#sec-topropertykey
            function ToPropertyKey(argument) {
                var key = ToPrimitive(argument, 3 /* String */);
                if (IsSymbol(key))
                    return key;
                return ToString(key);
            }
            // 7.2 Testing and Comparison Operations
            // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
            // 7.2.2 IsArray(argument)
            // https://tc39.github.io/ecma262/#sec-isarray
            function IsArray(argument) {
                return Array.isArray
                    ? Array.isArray(argument)
                    : argument instanceof Object
                        ? argument instanceof Array
                        : Object.prototype.toString.call(argument) === "[object Array]";
            }
            // 7.2.3 IsCallable(argument)
            // https://tc39.github.io/ecma262/#sec-iscallable
            function IsCallable(argument) {
                // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
                return typeof argument === "function";
            }
            // 7.2.4 IsConstructor(argument)
            // https://tc39.github.io/ecma262/#sec-isconstructor
            function IsConstructor(argument) {
                // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
                return typeof argument === "function";
            }
            // 7.2.7 IsPropertyKey(argument)
            // https://tc39.github.io/ecma262/#sec-ispropertykey
            function IsPropertyKey(argument) {
                switch (Type(argument)) {
                    case 3 /* String */: return true;
                    case 4 /* Symbol */: return true;
                    default: return false;
                }
            }
            // 7.3 Operations on Objects
            // https://tc39.github.io/ecma262/#sec-operations-on-objects
            // 7.3.9 GetMethod(V, P)
            // https://tc39.github.io/ecma262/#sec-getmethod
            function GetMethod(V, P) {
                var func = V[P];
                if (func === undefined || func === null)
                    return undefined;
                if (!IsCallable(func))
                    throw new TypeError();
                return func;
            }
            // 7.4 Operations on Iterator Objects
            // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
            function GetIterator(obj) {
                var method = GetMethod(obj, iteratorSymbol);
                if (!IsCallable(method))
                    throw new TypeError(); // from Call
                var iterator = method.call(obj);
                if (!IsObject(iterator))
                    throw new TypeError();
                return iterator;
            }
            // 7.4.4 IteratorValue(iterResult)
            // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
            function IteratorValue(iterResult) {
                return iterResult.value;
            }
            // 7.4.5 IteratorStep(iterator)
            // https://tc39.github.io/ecma262/#sec-iteratorstep
            function IteratorStep(iterator) {
                var result = iterator.next();
                return result.done ? false : result;
            }
            // 7.4.6 IteratorClose(iterator, completion)
            // https://tc39.github.io/ecma262/#sec-iteratorclose
            function IteratorClose(iterator) {
                var f = iterator["return"];
                if (f)
                    f.call(iterator);
            }
            // 9.1 Ordinary Object Internal Methods and Internal Slots
            // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
            // 9.1.1.1 OrdinaryGetPrototypeOf(O)
            // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
            function OrdinaryGetPrototypeOf(O) {
                var proto = Object.getPrototypeOf(O);
                if (typeof O !== "function" || O === functionPrototype)
                    return proto;
                // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
                // Try to determine the superclass constructor. Compatible implementations
                // must either set __proto__ on a subclass constructor to the superclass constructor,
                // or ensure each class has a valid `constructor` property on its prototype that
                // points back to the constructor.
                // If this is not the same as Function.[[Prototype]], then this is definately inherited.
                // This is the case when in ES6 or when using __proto__ in a compatible browser.
                if (proto !== functionPrototype)
                    return proto;
                // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
                var prototype = O.prototype;
                var prototypeProto = prototype && Object.getPrototypeOf(prototype);
                if (prototypeProto == null || prototypeProto === Object.prototype)
                    return proto;
                // If the constructor was not a function, then we cannot determine the heritage.
                var constructor = prototypeProto.constructor;
                if (typeof constructor !== "function")
                    return proto;
                // If we have some kind of self-reference, then we cannot determine the heritage.
                if (constructor === O)
                    return proto;
                // we have a pretty good guess at the heritage.
                return constructor;
            }
            // naive Map shim
            function CreateMapPolyfill() {
                var cacheSentinel = {};
                var arraySentinel = [];
                var MapIterator = /** @class */ (function () {
                    function MapIterator(keys, values, selector) {
                        this._index = 0;
                        this._keys = keys;
                        this._values = values;
                        this._selector = selector;
                    }
                    MapIterator.prototype["@@iterator"] = function () { return this; };
                    MapIterator.prototype[iteratorSymbol] = function () { return this; };
                    MapIterator.prototype.next = function () {
                        var index = this._index;
                        if (index >= 0 && index < this._keys.length) {
                            var result = this._selector(this._keys[index], this._values[index]);
                            if (index + 1 >= this._keys.length) {
                                this._index = -1;
                                this._keys = arraySentinel;
                                this._values = arraySentinel;
                            }
                            else {
                                this._index++;
                            }
                            return { value: result, done: false };
                        }
                        return { value: undefined, done: true };
                    };
                    MapIterator.prototype.throw = function (error) {
                        if (this._index >= 0) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        throw error;
                    };
                    MapIterator.prototype.return = function (value) {
                        if (this._index >= 0) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        return { value: value, done: true };
                    };
                    return MapIterator;
                }());
                return /** @class */ (function () {
                    function Map() {
                        this._keys = [];
                        this._values = [];
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    }
                    Object.defineProperty(Map.prototype, "size", {
                        get: function () { return this._keys.length; },
                        enumerable: true,
                        configurable: true
                    });
                    Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
                    Map.prototype.get = function (key) {
                        var index = this._find(key, /*insert*/ false);
                        return index >= 0 ? this._values[index] : undefined;
                    };
                    Map.prototype.set = function (key, value) {
                        var index = this._find(key, /*insert*/ true);
                        this._values[index] = value;
                        return this;
                    };
                    Map.prototype.delete = function (key) {
                        var index = this._find(key, /*insert*/ false);
                        if (index >= 0) {
                            var size = this._keys.length;
                            for (var i = index + 1; i < size; i++) {
                                this._keys[i - 1] = this._keys[i];
                                this._values[i - 1] = this._values[i];
                            }
                            this._keys.length--;
                            this._values.length--;
                            if (key === this._cacheKey) {
                                this._cacheKey = cacheSentinel;
                                this._cacheIndex = -2;
                            }
                            return true;
                        }
                        return false;
                    };
                    Map.prototype.clear = function () {
                        this._keys.length = 0;
                        this._values.length = 0;
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    };
                    Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
                    Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
                    Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
                    Map.prototype["@@iterator"] = function () { return this.entries(); };
                    Map.prototype[iteratorSymbol] = function () { return this.entries(); };
                    Map.prototype._find = function (key, insert) {
                        if (this._cacheKey !== key) {
                            this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                        }
                        if (this._cacheIndex < 0 && insert) {
                            this._cacheIndex = this._keys.length;
                            this._keys.push(key);
                            this._values.push(undefined);
                        }
                        return this._cacheIndex;
                    };
                    return Map;
                }());
                function getKey(key, _) {
                    return key;
                }
                function getValue(_, value) {
                    return value;
                }
                function getEntry(key, value) {
                    return [key, value];
                }
            }
            // naive Set shim
            function CreateSetPolyfill() {
                return /** @class */ (function () {
                    function Set() {
                        this._map = new _Map();
                    }
                    Object.defineProperty(Set.prototype, "size", {
                        get: function () { return this._map.size; },
                        enumerable: true,
                        configurable: true
                    });
                    Set.prototype.has = function (value) { return this._map.has(value); };
                    Set.prototype.add = function (value) { return this._map.set(value, value), this; };
                    Set.prototype.delete = function (value) { return this._map.delete(value); };
                    Set.prototype.clear = function () { this._map.clear(); };
                    Set.prototype.keys = function () { return this._map.keys(); };
                    Set.prototype.values = function () { return this._map.values(); };
                    Set.prototype.entries = function () { return this._map.entries(); };
                    Set.prototype["@@iterator"] = function () { return this.keys(); };
                    Set.prototype[iteratorSymbol] = function () { return this.keys(); };
                    return Set;
                }());
            }
            // naive WeakMap shim
            function CreateWeakMapPolyfill() {
                var UUID_SIZE = 16;
                var keys = HashMap.create();
                var rootKey = CreateUniqueKey();
                return /** @class */ (function () {
                    function WeakMap() {
                        this._key = CreateUniqueKey();
                    }
                    WeakMap.prototype.has = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? HashMap.has(table, this._key) : false;
                    };
                    WeakMap.prototype.get = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? HashMap.get(table, this._key) : undefined;
                    };
                    WeakMap.prototype.set = function (target, value) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                        table[this._key] = value;
                        return this;
                    };
                    WeakMap.prototype.delete = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? delete table[this._key] : false;
                    };
                    WeakMap.prototype.clear = function () {
                        // NOTE: not a real clear, just makes the previous data unreachable
                        this._key = CreateUniqueKey();
                    };
                    return WeakMap;
                }());
                function CreateUniqueKey() {
                    var key;
                    do
                        key = "@@WeakMap@@" + CreateUUID();
                    while (HashMap.has(keys, key));
                    keys[key] = true;
                    return key;
                }
                function GetOrCreateWeakMapTable(target, create) {
                    if (!hasOwn.call(target, rootKey)) {
                        if (!create)
                            return undefined;
                        Object.defineProperty(target, rootKey, { value: HashMap.create() });
                    }
                    return target[rootKey];
                }
                function FillRandomBytes(buffer, size) {
                    for (var i = 0; i < size; ++i)
                        buffer[i] = Math.random() * 0xff | 0;
                    return buffer;
                }
                function GenRandomBytes(size) {
                    if (typeof Uint8Array === "function") {
                        if (typeof crypto !== "undefined")
                            return crypto.getRandomValues(new Uint8Array(size));
                        if (typeof msCrypto !== "undefined")
                            return msCrypto.getRandomValues(new Uint8Array(size));
                        return FillRandomBytes(new Uint8Array(size), size);
                    }
                    return FillRandomBytes(new Array(size), size);
                }
                function CreateUUID() {
                    var data = GenRandomBytes(UUID_SIZE);
                    // mark as random - RFC 4122 § 4.4
                    data[6] = data[6] & 0x4f | 0x40;
                    data[8] = data[8] & 0xbf | 0x80;
                    var result = "";
                    for (var offset = 0; offset < UUID_SIZE; ++offset) {
                        var byte = data[offset];
                        if (offset === 4 || offset === 6 || offset === 8)
                            result += "-";
                        if (byte < 16)
                            result += "0";
                        result += byte.toString(16).toLowerCase();
                    }
                    return result;
                }
            }
            // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
            function MakeDictionary(obj) {
                obj.__ = undefined;
                delete obj.__;
                return obj;
            }
        });
    })(Reflect$1 || (Reflect$1 = {}));

    var i=function(){function e(){}return e.getBaseClass=function(e){return e?Reflect.getPrototypeOf(e):void 0},e.getJsonPropertiesMetadata=function(t,i){if(t){var r=""+e.apiMap+(i||t.constructor.name);return Reflect.getMetadata(r,t)}},e.getParamTypes=function(t){return t?Reflect.getMetadata(e.designParamTypes,t):void 0},e.getJsonObjectMetadata=function(t){return t?Reflect.getMetadata(e.apiMapJsonObject,t):void 0},e.getType=function(t,i){return t?Reflect.getMetadata(e.designType,t,i):void 0},e.isJsonObject=function(t){return !!t&&Reflect.hasOwnMetadata(e.apiMapJsonObject,t)},e.setJsonPropertiesMetadata=function(t,i){if(i){var r=""+e.apiMap+i.constructor.name;Reflect.defineMetadata(r,t,i);}},e.setJsonObject=function(t,i){i&&Reflect.defineMetadata(e.apiMapJsonObject,t,i);},e.setType=function(t,i,r){i&&t&&Reflect.defineMetadata(e.designType,t,i,r);},e.apiMap="api:map:",e.apiMapJsonObject=e.apiMap+"jsonObject",e.designType="design:type",e.designParamTypes="design:paramtypes",e}(),r=function(e){return "string"==typeof e},n=function(e){return null!==e&&"object"==typeof e&&!o(e)},o=function(e){return Array.isArray(e)},a=function(e){return "[object Date]"===toString.call(e)},s=function(e){return [null,void 0].includes(e)},l=function(e){return i.isJsonObject(e)},u=function(e){try{var t=JSON.parse(e);return "object"==typeof t?t:e}catch(t){return e}},c=function(){this.errorCallback=f,this.nullishPolicy={undefined:"remove",null:"allow"};},f=function(e){console.error(e);},d=function(){function p(e){this.options=new c,this.options=__assign(__assign({},this.options),e);}return p.prototype.deserialize=function(e,t){return r(e)&&(e=u(e)),o(e)?this.deserializeObjectArray(e,t):n(e)?this.deserializeObject(e,t):void this.error("Fail to deserialize: value is not an Array nor an Object.\nReceived: "+JSON.stringify(e)+".")},p.prototype.deserializeObject=function(e,t){var i=this;if(null===e)return "disallow"===this.options.nullishPolicy.null&&this.error("Fail to deserialize: null is not assignable to type Object."),null;if(void 0!==e){if(r(e)&&(e=u(e)),n(e)){var o=function(e){if("function"!=typeof e)return !1;try{Reflect.construct(String,[],e);}catch(e){return !1}return !0}(t)?new t({}):t,a=this.getJsonPropertiesMetadata(o);return a?(Object.keys(a).forEach((function(t){var r=a[t],n=i.deserializeProperty(o,t,e,r);if(r.required&&s(n)){var l=o.constructor.name;i.error("Property '"+t+"' is required in "+l+" "+JSON.stringify(e)+".");}i.isAllowedProperty(n)&&(o[t]=n);})),o):o}this.error("Fail to deserialize: type '"+typeof e+"' is not assignable to type 'Object'.\nReceived: "+JSON.stringify(e));}else "disallow"===this.options.nullishPolicy.undefined&&this.error("Fail to deserialize: undefined is not assignable to type Object.");},p.prototype.deserializeObjectArray=function(e,t){var i=this;if(null===e)return "disallow"===this.options.nullishPolicy.null&&this.error("Fail to deserialize: null is not assignable to type Array."),null;if(void 0!==e){if(r(e)&&(e=u(e)),o(e))return e.reduce((function(e,r){var n=i.deserializeObject(r,t);return (!s(n)||null===n&&"remove"!==i.options.nullishPolicy.null||void 0===n&&"remove"!==i.options.nullishPolicy.undefined)&&e.push(n),e}),[]);this.error("Fail to deserialize: type '"+typeof e+"' is not assignable to type 'Array'.\nReceived: "+JSON.stringify(e));}else "disallow"===this.options.nullishPolicy.undefined&&this.error("Fail to deserialize: undefined is not assignable to type Array.");},p.prototype.serialize=function(e){return o(e)?this.serializeObjectArray(e):n(e)?this.serializeObject(e):void this.error("Fail to serialize: value is not an Array nor an Object.\nReceived: "+JSON.stringify(e)+".")},p.prototype.serializeObject=function(e){var t=this;if(null===e)return "disallow"===this.options.nullishPolicy.null&&this.error("Fail to serialize: null is not assignable to type Object."),null;if(void 0!==e){if(!n(e))return e;var i=this.getJsonPropertiesMetadata(e);if(!i)return e;var r={},a=Object.keys(e);return Object.keys(i).forEach((function(n){if(a.includes(n)){var s=i[n],l=void 0;s.beforeSerialize&&(l=e[n],e[n]=s.beforeSerialize(e[n],e));var u=t.serializeProperty(e,n,s);if(s.afterSerialize&&(u=s.afterSerialize(u,e)),e[n]=l||e[n],o(s.name))s.name.forEach((function(e){t.isAllowedProperty(u[e])&&(r[e]=u[e]);}));else if(t.isAllowedProperty(u))if(s.isNameOverridden||void 0===t.options.formatPropertyName)r[s.name]=u;else {var c=t.options.formatPropertyName(s.name);r[c]=u;}}else "remove"!==t.options.nullishPolicy.undefined&&(r[n]=void 0);})),r}"disallow"===this.options.nullishPolicy.undefined&&this.error("Fail to serialize: undefined is not assignable to type Object.");},p.prototype.serializeObjectArray=function(e){var t=this;if(null===e)return "disallow"===this.options.nullishPolicy.null&&this.error("Fail to serialize: null is not assignable to type Array."),null;if(void 0!==e){if(o(e))return e.reduce((function(e,i){var r=t.serializeObject(i);return (!s(r)||null===r&&"remove"!==t.options.nullishPolicy.null||void 0===r&&"remove"!==t.options.nullishPolicy.undefined)&&e.push(r),e}),[]);this.error("Fail to serialize: type '"+typeof e+"' is not assignable to type 'Array'.\nReceived: "+JSON.stringify(e)+".");}else "disallow"===this.options.nullishPolicy.undefined&&this.error("Fail to serialize: undefined is not assignable to type Array.");},p.prototype.deserializeProperty=function(e,t,r,n){var o;if(!s(r)){var a=this.getDataSource(r,n,this.options.formatPropertyName);if(s(a))return a;var u,c=i.getType(e,t),p=null===(o=null==c?void 0:c.name)||void 0===o?void 0:o.toLowerCase(),f="array"===p,d="set"===p,y="map"===p,v=n.type||c;n.beforeDeserialize&&(a=n.beforeDeserialize(a,e));var h=n.predicate;return n.isDictionary||y?(u=this.deserializeDictionary(a,v,h),y&&(u=new Map(Object.entries(u)))):f||d?(u=this.deserializeArray(a,v,h),d&&(u=new Set(u))):!l(v)&&!h||h&&!h(a,r)?u=this.deserializePrimitive(a,v.name):(v=n.predicate?n.predicate(a,r):v,u=this.deserializeObject(a,v)),n.afterDeserialize&&(u=n.afterDeserialize(u,e)),u}},p.prototype.deserializePrimitive=function(e,t){if(s(t))return e;if(typeof e===(t=t.toLowerCase()))return e;var i="Fail to deserialize: type '"+typeof e+"' is not assignable to type '"+t+"'.\nReceived: "+JSON.stringify(e);switch(t){case"string":var r=e.toString();return "[object Object]"===r?void this.error(i):r;case"number":return function(e){return "number"==typeof e}(e)?+e:void this.error(i);case"boolean":return void this.error(i);case"date":return function(e){return !a(e)&&!o(e)&&!isNaN(Date.parse(e))}(e)?new Date(e):void this.error(i);default:return e}},p.prototype.deserializeDictionary=function(e,t,i){var r=this;if(n(e)){var o={};return Object.keys(e).forEach((function(n){var a=i?i(e[n],e):void 0;l(t)||a?o[n]=r.deserializeObject(e[n],a||t):o[n]=r.deserializePrimitive(e[n],typeof e[n]);})),o}this.error("Fail to deserialize: type '"+typeof e+"' is not assignable to type 'Dictionary'.\nReceived: "+JSON.stringify(e)+".");},p.prototype.deserializeArray=function(e,t,i){var r=this;if(o(e))return e.reduce((function(n,o){var a;return l(t)||i?(t=i?i(o,e):t,a=r.deserializeObject(o,t)):a=r.deserializePrimitive(o,typeof o),(!s(a)||null===a&&"remove"!==r.options.nullishPolicy.null||void 0===a&&"remove"!==r.options.nullishPolicy.undefined)&&n.push(a),n}),[]);this.error("Fail to deserialize: type '"+typeof e+"' is not assignable to type 'Array'.\nReceived: "+JSON.stringify(e));},p.prototype.error=function(e){this.options.errorCallback&&this.options.errorCallback(e);},p.prototype.getClassesJsonPropertiesMetadata=function(e,t){return e?e.reduce((function(e,r){var n=i.getJsonPropertiesMetadata(t,r);return n&&e.push(n),e}),[]):[]},p.prototype.getDataSource=function(e,t,i){var r=t.name,n=t.isNameOverridden;if(o(r)){var a={};return r.forEach((function(t){return a[t]=e[t]})),a}return !n&&i?(r=i(r),e[r]):e[r]},p.prototype.getJsonPropertiesMetadata=function(t){var r,n=(null!==(r=i.getJsonObjectMetadata(t.constructor))&&void 0!==r?r:{}).baseClassNames,o=i.getJsonPropertiesMetadata(t);if(!(o||n&&n.length))return o;if(n&&n.length){var a=this.getClassesJsonPropertiesMetadata(n,t);return this.mergeJsonPropertiesMetadata.apply(this,__spreadArray(__spreadArray([],a),[o]))}return o},p.prototype.isAllowedProperty=function(e){if(s(e)){if("disallow"===this.options.nullishPolicy[""+e])return this.error("Disallowed "+e+" value detected."),!1;if("remove"===this.options.nullishPolicy[""+e])return !1}return !0},p.prototype.mergeJsonPropertiesMetadata=function(){for(var e=[],i=0;i<arguments.length;i++)e[i]=arguments[i];var r={};return e.forEach((function(e){e&&Object.keys(e).forEach((function(i){r[i]=__assign(__assign({},r[i]),e[i]);}));})),r},p.prototype.serializeDictionary=function(e){var t=this;if(n(e)){var i={};return Object.keys(e).forEach((function(r){i[r]=t.serializeObject(e[r]);})),i}this.error("Fail to serialize: type '"+typeof e+"' is not assignable to type 'Dictionary'.\nReceived: "+JSON.stringify(e)+".");},p.prototype.serializeProperty=function(e,t,n){var o,s,u=this,c=e[t],p=i.getType(e,t),f=null===(o=null==p?void 0:p.name)||void 0===o?void 0:o.toLowerCase(),d="array"===f,y="set"===f,v="map"===f,h=n.predicate,g=n.type||p,b=l(g);if(c&&(b||h)){if(d||y){var m=y?Array.from(c):c;return this.serializeObjectArray(m)}if(n.isDictionary||v){if(!v)return this.serializeDictionary(c);var O={};return c.forEach((function(e,t){r(t)?O[t]=e:u.error("Fail to serialize: type of '"+typeof t+"' is not assignable to type 'string'.\nReceived: "+JSON.stringify(t)+".");})),console.log(O),this.serializeDictionary(O)}return this.serializeObject(c)}return "date"===(null===(s=null==g?void 0:g.name)||void 0===s?void 0:s.toLocaleLowerCase())&&a(c)?c.toISOString():c},p}(),y=function(t){var r=i.getBaseClass(t);return r&&r.name?__spreadArray(__spreadArray([],y(r)),[r.name]):[]},v=function(){return function(e){var t=y(e);i.setJsonObject({baseClassNames:t},e);}},h=function(e){return function(t,r,n){var o;if(void 0===r&&t.prototype){var a=i.getParamTypes(t)[n];r=g(t.prototype.constructor).get(n),t=t.prototype,i.setType(a,t,r);}var s=null!==(o=i.getJsonPropertiesMetadata(t))&&void 0!==o?o:{};s[r]=b(r,e),i.setJsonPropertiesMetadata(s,t);}},g=function(e){var t,i=e.toString().split("}")[0].replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm,"").replace(/[\r\t\n\v\f ]/g,""),r=i.length;","===i[r-2]&&(t=i[r-1]);var n=t?new RegExp("(?:(this|"+t+"|\\("+t+"=t.call\\(this(,.)*\\)\\))\\.)([^,;\n}]+)","gm"):new RegExp("(?:(this)\\.)([^,;\n}]+)","gm"),o=new Map,a=/(?:.*(?:constructor|function).*?(?=\())(?:\()(.+?(?=\)))/m.exec(i);if(!a||!a.length)return o;for(var s,l=a[1].split(","),u=function(){var e=s.length-1,t=s[e].split("="),i=l.findIndex((function(e){return e===t[1]}));i>-1&&o.set(i,t[0]);};s=n.exec(i);)u();return o},b=function(e,o){var a={name:e.toString()};return o?r(o)?(a.name=o,a.isNameOverridden=!0,a):(n(o)&&(a=__assign(__assign({},a),o),o.name&&(a.name=o.name,a.isNameOverridden=!0),function(e){if(!e)return !1;var t=i.getParamTypes(e),r=e.length;return (1===r||2===r)&&!t}(o.type)&&(delete a.type,a.predicate=o.type)),a):a};

    var fanPosition_1;
    let fanPosition = fanPosition_1 = class fanPosition {
        constructor(temperature, fanRPMpercent) {
            this.fanRPMpercent = Math.min(Math.max(fanRPMpercent, fanPosition_1.fanMin), fanPosition_1.fanMax);
            this.temperature = Math.min(Math.max(temperature, fanPosition_1.tempMin), fanPosition_1.tempMax);
        }
        getCanvasPos(canWidth, canHeight) {
            var canPosx = Math.min(Math.max(this.temperature / fanPosition_1.tempMax * canWidth, 0), canWidth);
            var canPosy = Math.min(Math.max((1 - this.fanRPMpercent / fanPosition_1.fanMax) * canHeight, 0), canHeight);
            return [canPosx, canPosy];
        }
        isCloseToOther(other, distance) {
            var getDis = Math.sqrt(Math.pow((other.temperature - this.temperature), 2) + Math.pow((other.fanRPMpercent - this.fanRPMpercent), 2));
            return getDis <= distance;
        }
        static createFanPosByCanPos(canx, cany, canWidth, canHeight) {
            var temperature = Math.min(Math.max(canx / canWidth * this.tempMax, this.tempMin), this.tempMax);
            var fanRPMpercent = Math.min(Math.max((1 - cany / canHeight) * this.fanMax, this.fanMin), this.fanMax);
            return new fanPosition_1(temperature, fanRPMpercent);
        }
    };
    fanPosition.tempMax = 100;
    fanPosition.fanMax = 100;
    fanPosition.fanMin = 0;
    fanPosition.tempMin = 0;
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], fanPosition.prototype, "temperature", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], fanPosition.prototype, "fanRPMpercent", void 0);
    fanPosition = fanPosition_1 = __decorate([
        v(),
        __metadata("design:paramtypes", [Number, Number])
    ], fanPosition);
    /*
    export class canvasPosition {
      @JsonProperty()
      canx?:number;
      @JsonProperty()
      cany?:number;
      constructor(canx:number,cany:number){
        this.canx=canx;
        this.cany=cany;
      }
      public getFanPos(canWidth:number,canHeight:number)
      {
        const tempMax=100;
        const fanMax=100;
        const fanMin=0;
        const tempMin=0;
        var temperature=Math.min(Math.max(this.canx!!/canWidth*tempMax,tempMin),tempMax);
        var fanRPMpercent=Math.min(Math.max((1-this.cany!!/canHeight)*fanMax,fanMin),fanMax);
        return new fanPosition(temperature,fanRPMpercent)
      }
    }
    */
    //通过画布位置来调整文字位置
    const getTextPosByCanvasPos = (canPosx, canPosy, canWidth, _canHeight) => {
        var textlen = 55;
        var textheight = 12;
        var offsetX = 0;
        var offsetY = 0;
        if (canPosx + textlen / 2 >= canWidth - 5) {
            offsetX = canWidth - textlen - canPosx;
        }
        else if (canPosx - textlen / 2 <= 5) {
            offsetX = -canPosx;
        }
        else {
            offsetX = -textlen / 2 + 2;
        }
        if (canPosy - textheight <= 5) {
            offsetY = textheight + 5;
        }
        else {
            offsetY = -textheight;
        }
        return [canPosx + offsetX, canPosy + offsetY];
    };
    const calPointInLine = (lineStart, lineEnd, calPointIndex) => {
        if (lineStart.temperature > lineEnd.temperature)
            return null;
        if (calPointIndex < lineStart.temperature || calPointIndex > lineEnd.temperature)
            return null;
        var deltaY = lineEnd.fanRPMpercent - lineStart.fanRPMpercent;
        var deltaX = lineEnd.temperature - lineStart.temperature;
        var calPointY = deltaX == 0 ? deltaY : (calPointIndex - lineStart.temperature) * (deltaY / deltaX) + lineStart.fanRPMpercent;
        return new fanPosition(calPointIndex, calPointY);
    };

    var Settings_1;
    const SETTINGS_KEY = "PowerControl";
    const serializer = new d();
    let AppSetting = class AppSetting {
        constructor() {
            this.overwrite = false;
            this.smt = false;
            this.cpuNum = Backend.data?.HasCpuMaxNum() ? Backend.data?.getCpuMaxNum() : 4;
            this.cpuboost = false;
            this.tdpEnable = true;
            this.tdp = Backend.data?.HasTDPMax() ? Math.trunc(Backend.data?.getTDPMax() / 2) : 15;
            this.gpuMode = GPUMODE.NOLIMIT;
            this.gpuFreq = Backend.data?.HasGPUFreqMax() ? Backend.data.getGPUFreqMax() : 1600;
            this.gpuAutoMaxFreq = Backend.data?.HasGPUFreqMax() ? Backend.data.getGPUFreqMax() : 1600;
            this.gpuAutoMinFreq = Backend.data?.HasGPUFreqMin() ? Backend.data.getGPUFreqMin() : 200;
            this.gpuRangeMaxFreq = Backend.data?.HasGPUFreqMax() ? Backend.data.getGPUFreqMax() : 1600;
            this.gpuRangeMinFreq = Backend.data?.HasGPUFreqMin() ? Backend.data.getGPUFreqMin() : 200;
        }
        deepCopy(copyTarget) {
            this.overwrite = copyTarget.overwrite;
            this.smt = copyTarget.smt;
            this.cpuNum = copyTarget.cpuNum;
            this.cpuboost = copyTarget.cpuboost;
            this.tdpEnable = copyTarget.tdpEnable;
            this.tdp = copyTarget.tdp;
            this.gpuMode = copyTarget.gpuMode;
            this.gpuFreq = copyTarget.gpuFreq;
            this.gpuAutoMaxFreq = copyTarget.gpuAutoMaxFreq;
            this.gpuAutoMinFreq = copyTarget.gpuAutoMinFreq;
            this.gpuRangeMaxFreq = copyTarget.gpuRangeMaxFreq;
            this.gpuRangeMinFreq = copyTarget.gpuAutoMinFreq;
            this.fanProfileName = copyTarget.fanProfileName;
        }
    };
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], AppSetting.prototype, "overwrite", void 0);
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], AppSetting.prototype, "smt", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "cpuNum", void 0);
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], AppSetting.prototype, "cpuboost", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "tdp", void 0);
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], AppSetting.prototype, "tdpEnable", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuMode", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuFreq", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuAutoMaxFreq", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuAutoMinFreq", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuRangeMaxFreq", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], AppSetting.prototype, "gpuRangeMinFreq", void 0);
    __decorate([
        h(),
        __metadata("design:type", String)
    ], AppSetting.prototype, "fanProfileName", void 0);
    AppSetting = __decorate([
        v(),
        __metadata("design:paramtypes", [])
    ], AppSetting);
    let FanSetting = class FanSetting {
        constructor(snapToGrid, fanMode, fixSpeed, curvePoints) {
            this.snapToGrid = false;
            this.fanMode = FANMODE.NOCONTROL;
            this.fixSpeed = 50;
            this.curvePoints = [];
            this.snapToGrid = snapToGrid;
            this.fanMode = fanMode;
            this.fixSpeed = fixSpeed;
            this.curvePoints = curvePoints;
        }
    };
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], FanSetting.prototype, "snapToGrid", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], FanSetting.prototype, "fanMode", void 0);
    __decorate([
        h(),
        __metadata("design:type", Number)
    ], FanSetting.prototype, "fixSpeed", void 0);
    __decorate([
        h({ type: fanPosition }),
        __metadata("design:type", Array)
    ], FanSetting.prototype, "curvePoints", void 0);
    FanSetting = __decorate([
        v(),
        __metadata("design:paramtypes", [Boolean, Number, Number, Array])
    ], FanSetting);
    let Settings = Settings_1 = class Settings {
        constructor() {
            this.enabled = true;
            this.perApp = {};
            this.fanSettings = {};
        }
        //插件是否开启
        static ensureEnable() {
            return this._instance.enabled;
        }
        //设置开启关闭
        static setEnable(enabled) {
            if (this._instance.enabled != enabled) {
                this._instance.enabled = enabled;
                Settings_1.saveSettingsToLocalStorage();
                if (enabled) {
                    Backend.applySettings(APPLYTYPE.SET_ALL);
                    PluginManager.updateAllComponent(UpdateType.SHOW);
                }
                else {
                    Backend.resetSettings();
                    PluginManager.updateAllComponent(UpdateType.HIDE);
                }
                PluginManager.updateAllComponent(UpdateType.UPDATE);
            }
        }
        //获取当前配置文件
        static ensureApp() {
            const appId = RunningApps.active();
            //没有配置文件的时候新生成一个
            if (!(appId in this._instance.perApp)) {
                this._instance.perApp[appId] = new AppSetting();
                //新生成后如果有默认配置文件，则拷贝默认配置文件
                if (DEFAULT_APP in this._instance.perApp)
                    this._instance.perApp[appId].deepCopy(this._instance.perApp[DEFAULT_APP]);
            }
            //如果未开启覆盖，则使用默认配置文件
            if (!this._instance.perApp[appId].overwrite) {
                return this._instance.perApp[DEFAULT_APP];
            }
            //使用appID配置文件
            return this._instance.perApp[appId];
        }
        static ensureAppID() {
            const appId = RunningApps.active();
            if (!(appId in this._instance.perApp)) {
                this._instance.perApp[appId] = new AppSetting();
                if (DEFAULT_APP in this._instance.perApp) {
                    this._instance.perApp[appId].deepCopy(this._instance.perApp[DEFAULT_APP]);
                    return DEFAULT_APP;
                }
                return appId;
            }
            if (!this._instance.perApp[appId].overwrite) {
                return DEFAULT_APP;
            }
            return appId;
        }
        static appOverWrite() {
            if (RunningApps.active() == DEFAULT_APP) {
                return false;
            }
            return Settings_1.ensureApp().overwrite;
        }
        static setOverWrite(overwrite) {
            if (RunningApps.active() != DEFAULT_APP && Settings_1.appOverWrite() != overwrite) {
                Settings_1._instance.perApp[RunningApps.active()].overwrite = overwrite;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_ALL);
                PluginManager.updateAllComponent(UpdateType.UPDATE);
            }
        }
        static appSmt() {
            return Settings_1.ensureApp().smt;
        }
        static setSmt(smt) {
            if (Settings_1.ensureApp().smt != smt) {
                Settings_1.ensureApp().smt = smt;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_CPUCORE);
                PluginManager.updateComponent(ComponentName.CPU_SMT, UpdateType.UPDATE);
            }
        }
        static appCpuNum() {
            return Settings_1.ensureApp().cpuNum;
        }
        static setCpuNum(cpuNum) {
            if (Settings_1.ensureApp().cpuNum != cpuNum) {
                Settings_1.ensureApp().cpuNum = cpuNum;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_CPUCORE);
                PluginManager.updateComponent(ComponentName.CPU_NUM, UpdateType.UPDATE);
            }
        }
        static appCpuboost() {
            return Settings_1.ensureApp().cpuboost;
        }
        static setCpuboost(cpuboost) {
            if (Settings_1.ensureApp().cpuboost != cpuboost) {
                Settings_1.ensureApp().cpuboost = cpuboost;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_CPUBOOST);
                PluginManager.updateComponent(ComponentName.CPU_BOOST, UpdateType.UPDATE);
            }
        }
        static appTDP() {
            return Settings_1.ensureApp().tdp;
        }
        static setTDP(tdp) {
            if (Settings_1.ensureApp().tdp != tdp) {
                Settings_1.ensureApp().tdp = tdp;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_TDP);
                PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
            }
        }
        static appTDPEnable() {
            return Settings_1.ensureApp().tdpEnable;
        }
        static setTDPEnable(tdpEnable) {
            if (Settings_1.ensureApp().tdpEnable != tdpEnable) {
                Settings_1.ensureApp().tdpEnable = tdpEnable;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_TDP);
                PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
            }
        }
        static appGPUMode() {
            return Settings_1.ensureApp().gpuMode;
        }
        //写入gpu模式配置并应用
        static setGPUMode(gpuMode) {
            if (Settings_1.ensureApp().gpuMode != gpuMode) {
                Settings_1.ensureApp().gpuMode = gpuMode;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_GPUMODE);
                PluginManager.updateComponent(ComponentName.GPU_FREQMODE, UpdateType.UPDATE);
            }
        }
        static appGPUFreq() {
            return Settings_1.ensureApp().gpuFreq;
        }
        //写入gpu固定频率并配置
        static setGPUFreq(gpuFreq) {
            if (Settings_1.ensureApp().gpuFreq != gpuFreq) {
                Settings_1.ensureApp().gpuFreq = gpuFreq;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_GPUMODE);
                PluginManager.updateComponent(ComponentName.GPU_FREQFIX, UpdateType.UPDATE);
            }
        }
        static appGPUAutoMaxFreq() {
            return Settings_1.ensureApp().gpuAutoMaxFreq;
        }
        //写入自动gpu最大频率
        static setGPUAutoMaxFreq(gpuAutoMaxFreq) {
            if (Settings_1.ensureApp().gpuAutoMaxFreq != gpuAutoMaxFreq) {
                Settings_1.ensureApp().gpuAutoMaxFreq = gpuAutoMaxFreq;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_GPUMODE);
                PluginManager.updateComponent(ComponentName.GPU_FREQRANGE, UpdateType.UPDATE);
            }
        }
        static appGPUAutoMinFreq() {
            return Settings_1.ensureApp().gpuAutoMinFreq;
        }
        //写入自动gpu最小频率
        static setGPUAutoMinFreq(gpuAutoMinFreq) {
            if (Settings_1.ensureApp().gpuAutoMinFreq != gpuAutoMinFreq) {
                Settings_1.ensureApp().gpuAutoMinFreq = gpuAutoMinFreq;
                Settings_1.saveSettingsToLocalStorage();
                Backend.applySettings(APPLYTYPE.SET_GPUMODE);
                PluginManager.updateComponent(ComponentName.GPU_FREQRANGE, UpdateType.UPDATE);
            }
        }
        static appGPURangeMaxFreq() {
            return Settings_1.ensureApp().gpuRangeMaxFreq;
        }
        static appGPURangeMinFreq() {
            return Settings_1.ensureApp().gpuRangeMinFreq;
        }
        //写入gpu范围频率
        static setGPURangeFreq(gpuRangeMaxFreq, gpuRangeMinFreq) {
            if (Settings_1.ensureApp().gpuRangeMaxFreq != gpuRangeMaxFreq || Settings_1.ensureApp().gpuRangeMinFreq != gpuRangeMinFreq) {
                Settings_1.ensureApp().gpuRangeMaxFreq = gpuRangeMaxFreq;
                Settings_1.ensureApp().gpuRangeMinFreq = gpuRangeMinFreq;
                Backend.applySettings(APPLYTYPE.SET_GPUMODE);
                Settings_1.saveSettingsToLocalStorage();
                PluginManager.updateComponent(ComponentName.GPU_FREQRANGE, UpdateType.UPDATE);
            }
        }
        //风扇配置文件名称
        static appFanSettingName() {
            return Settings_1.ensureApp().fanProfileName;
        }
        //风扇配置文件内容
        static appFanSetting() {
            var fanProfileName = Settings_1.ensureApp().fanProfileName;
            if (fanProfileName in this._instance.fanSettings) {
                return this._instance.fanSettings[fanProfileName];
            }
            else {
                return undefined;
            }
        }
        //设置使用的风扇配置文件名称
        static setAppFanSettingName(fanProfileName) {
            if (Settings_1.ensureApp().fanProfileName != fanProfileName) {
                Settings_1.ensureApp().fanProfileName = fanProfileName;
                Settings_1.saveSettingsToLocalStorage();
                //Backend.applySettings(APPLYTYPE.SET_FAN);
            }
        }
        //添加一个风扇配置
        static addFanSetting(fanProfileName, fanSetting) {
            if (fanProfileName != undefined) {
                this._instance.fanSettings[fanProfileName] = fanSetting;
                Settings_1.saveSettingsToLocalStorage();
                return true;
            }
            else {
                return false;
            }
        }
        //删除一个风扇配置
        static removeFanSetting(fanProfileName) {
            if (fanProfileName in this._instance.fanSettings) {
                delete this._instance.fanSettings[fanProfileName];
                Object.entries(this._instance.perApp).forEach(([_appID, appSettings]) => {
                    if (appSettings.fanProfileName == fanProfileName) {
                        appSettings.fanProfileName = this._instance.perApp[DEFAULT_APP].fanProfileName;
                    }
                });
                Settings_1.saveSettingsToLocalStorage();
            }
        }
        //获取风扇配置列表
        static getFanSettings() {
            return this._instance.fanSettings;
        }
        static loadSettingsFromLocalStorage() {
            const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
            const settingsJson = JSON.parse(settingsString);
            const loadSetting = serializer.deserializeObject(settingsJson, Settings_1);
            this._instance.enabled = loadSetting ? loadSetting.enabled : false;
            this._instance.perApp = loadSetting ? loadSetting.perApp : {};
            this._instance.fanSettings = loadSetting ? loadSetting.fanSettings : {};
        }
        static saveSettingsToLocalStorage() {
            const settingsJson = serializer.serializeObject(this._instance);
            const settingsString = JSON.stringify(settingsJson);
            localStorage.setItem(SETTINGS_KEY, settingsString);
        }
    };
    Settings._instance = new Settings_1();
    __decorate([
        h(),
        __metadata("design:type", Boolean)
    ], Settings.prototype, "enabled", void 0);
    __decorate([
        h({ isDictionary: true, type: AppSetting }),
        __metadata("design:type", Object)
    ], Settings.prototype, "perApp", void 0);
    __decorate([
        h({ isDictionary: true, type: FanSetting }),
        __metadata("design:type", Object)
    ], Settings.prototype, "fanSettings", void 0);
    Settings = Settings_1 = __decorate([
        v()
    ], Settings);

    const DEFAULT_APP = "0";
    class RunningApps {
        static pollActive() {
            const newApp = RunningApps.active();
            if (this.lastAppId != newApp) {
                this.listeners.forEach((h) => h(newApp, this.lastAppId));
            }
            this.lastAppId = newApp;
        }
        static register() {
            if (this.intervalId == undefined)
                this.intervalId = setInterval(() => this.pollActive(), 100);
        }
        static unregister() {
            if (this.intervalId != undefined)
                clearInterval(this.intervalId);
            this.listeners.splice(0, this.listeners.length);
        }
        static listenActiveChange(fn) {
            const idx = this.listeners.push(fn) - 1;
            return () => {
                this.listeners.splice(idx, 1);
            };
        }
        static active() {
            return Router.MainRunningApp?.appid || DEFAULT_APP;
        }
        static active_appInfo() {
            return Router.MainRunningApp || null;
        }
    }
    RunningApps.listeners = [];
    RunningApps.lastAppId = DEFAULT_APP;
    class FanControl {
        static async register() {
            if (!Backend.data.getFanIsAdapt()) {
                this.disableFan();
                return;
            }
            if (this.intervalId == undefined)
                this.intervalId = setInterval(() => this.updateFan(), 1000);
            this.fanIsEnable = true;
        }
        static async updateFan() {
            FanControl.updateFanMode();
            FanControl.updateFanInfo();
            PluginManager.updateComponent(ComponentName.FAN_DISPLAY, UpdateType.UPDATE);
        }
        static async updateFanMode() {
            const fanSetting = Settings.appFanSetting();
            const fanMode = fanSetting?.fanMode;
            if (FanControl.fanMode == undefined || FanControl.fanMode != fanMode) {
                FanControl.fanMode = fanMode;
                Backend.applySettings(APPLYTYPE.SET_FANMODE);
            }
        }
        static async updateFanInfo() {
            await Backend.data.getFanRPM().then((value) => {
                this.fanRPM = value;
                FanControl.nowPoint.fanRPMpercent = Backend.data.HasFanMAXPRM() ? value / Backend.data.getFanMAXPRM() * 100 : -273;
            });
            await Backend.data.getFanTemp().then((value) => {
                FanControl.nowPoint.temperature = value;
            });
            const fanSetting = Settings.appFanSetting();
            const fanMode = fanSetting?.fanMode;
            switch (fanMode) {
                case (FANMODE.NOCONTROL): {
                    break;
                }
                case (FANMODE.FIX): {
                    var fixSpeed = fanSetting?.fixSpeed;
                    FanControl.setPoint.temperature = FanControl.nowPoint.temperature;
                    FanControl.setPoint.fanRPMpercent = fixSpeed;
                    break;
                }
                case (FANMODE.CURVE): {
                    var curvePoints = fanSetting?.curvePoints.sort((a, b) => {
                        return a.temperature == b.temperature ? a.fanRPMpercent - b.fanRPMpercent : a.temperature - b.temperature;
                    });
                    //每俩点判断是否在这俩点之间
                    var lineStart = new fanPosition(fanPosition.tempMin, fanPosition.fanMin);
                    if (curvePoints?.length > 0) {
                        //初始点到第一个点
                        var lineEnd = curvePoints[0];
                        if (FanControl.nowPoint.temperature > lineStart.temperature && FanControl.nowPoint.temperature <= lineEnd.temperature) {
                            FanControl.setPoint = calPointInLine(lineStart, lineEnd, FanControl.nowPoint.temperature);
                        }
                        curvePoints?.forEach((value, index) => {
                            if (index > curvePoints?.length - 1)
                                return;
                            lineStart = value;
                            lineEnd = index == curvePoints?.length - 1 ? new fanPosition(fanPosition.tempMax, fanPosition.fanMax) : curvePoints[index + 1];
                            if (FanControl.nowPoint.temperature > lineStart.temperature && FanControl.nowPoint.temperature <= lineEnd.temperature) {
                                FanControl.setPoint = calPointInLine(lineStart, lineEnd, FanControl.nowPoint.temperature);
                                return;
                            }
                        });
                    }
                    else {
                        var lineEnd = new fanPosition(fanPosition.tempMax, fanPosition.fanMax);
                        if (FanControl.nowPoint.temperature > lineStart.temperature && FanControl.nowPoint.temperature <= lineEnd.temperature) {
                            FanControl.setPoint = calPointInLine(lineStart, lineEnd, FanControl.nowPoint.temperature);
                            break;
                        }
                    }
                    break;
                }
                default: {
                    console.error(`错误的fanmode = ${fanMode}`);
                }
            }
            Backend.applySettings(APPLYTYPE.SET_FANRPM);
        }
        static enableFan() {
            this.fanIsEnable = true;
            this.register();
        }
        static disableFan() {
            this.fanIsEnable = false;
            this.unregister();
        }
        static unregister() {
            Backend.resetFanSettings();
            if (this.intervalId != undefined)
                clearInterval(this.intervalId);
        }
    }
    FanControl.nowPoint = new fanPosition(0, 0);
    FanControl.setPoint = new fanPosition(0, 0);
    FanControl.fanRPM = 0;
    FanControl.fanIsEnable = false;
    class PluginManager {
        static isIniting() {
            return PluginManager.state == PluginState.INIT;
        }
        //下发某个组件更新事件
        static updateComponent(comName, updateType) {
            if (this.listeners.has(comName)) {
                this.listeners.get(comName)?.forEach((fn, _wholisten) => {
                    fn(comName, updateType);
                    //console.log(`test_fn: wholisten=${wholisten} comName=${comName} updateType=${updateType}`);
                });
            }
        }
        //下发所有更新事件
        static updateAllComponent(updateType) {
            this.listeners.forEach((listenList, lisComName) => {
                listenList.forEach((fn) => {
                    fn(lisComName, updateType);
                    //console.log(`test_fn:comName=${lisComName} updateType=${updateType}`);
                });
            });
        }
        //监听组件更新事件（哪个组件监听，被监听组件，监听事件）
        static listenUpdateComponent(whoListen, lisComponentNames, lisfn) {
            lisComponentNames.forEach((lisComponentName) => {
                if (this.listeners.has(lisComponentName) && this.listeners.get(lisComponentName) != undefined) {
                    this.listeners.get(lisComponentName)?.set(whoListen, lisfn);
                }
                else {
                    this.listeners.set(lisComponentName, new Map());
                    this.listeners.get(lisComponentName)?.set(whoListen, lisfn);
                }
            });
        }
    }
    PluginManager.listeners = new Map();
    PluginManager.register = async (serverAPI) => {
        PluginManager.state = PluginState.INIT;
        await Backend.init(serverAPI);
        await localizationManager.init(serverAPI);
        RunningApps.register();
        FanControl.register();
        RunningApps.listenActiveChange((newAppId, oldAppId) => {
            console.log(`newAppId=${newAppId} oldAppId=${oldAppId}`);
            if (Settings.ensureEnable()) {
                Backend.applySettings(APPLYTYPE.SET_ALL);
            }
        });
        Settings.loadSettingsFromLocalStorage();
        Backend.applySettings(APPLYTYPE.SET_ALL);
        PluginManager.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
            if (Settings.ensureEnable()) {
                Backend.throwSuspendEvt();
            }
            Backend.applySettings(APPLYTYPE.SET_ALL);
        });
        PluginManager.state = PluginState.RUN;
    };
    PluginManager.unregister = () => {
        PluginManager.suspendEndHook.unregister();
        PluginManager.updateAllComponent(UpdateType.DISMOUNT);
        RunningApps.unregister();
        FanControl.unregister();
        Backend.resetSettings();
        PluginManager.state = PluginState.QUIT;
    };

    class BackendData {
        constructor() {
            this.cpuMaxNum = 0;
            this.has_cpuMaxNum = false;
            this.tdpMax = 0;
            this.has_tdpMax = false;
            this.has_ryzenadj = false;
            this.gpuMax = 0;
            this.has_gpuMax = false;
            this.gpuMin = 0;
            this.has_gpuMin = false;
            this.fanMaxRPM = 0;
            this.has_fanMaxRPM = false;
            this.fanIsAdapted = false;
        }
        async init(serverAPI) {
            this.serverAPI = serverAPI;
            await serverAPI.callPluginMethod("get_cpuMaxNum", {}).then(res => {
                if (res.success) {
                    console.info("cpuMaxNum = " + res.result);
                    this.cpuMaxNum = res.result;
                    this.has_cpuMaxNum = true;
                }
            });
            await serverAPI.callPluginMethod("get_tdpMax", {}).then(res => {
                if (res.success) {
                    console.info("tdpMax = " + res.result);
                    this.tdpMax = res.result;
                    this.has_tdpMax = true;
                }
            });
            await serverAPI.callPluginMethod("get_hasRyzenadj", {}).then(res => {
                if (res.success) {
                    console.info("has_ryzenadj = " + res.result);
                    this.has_ryzenadj = res.result;
                }
            });
            await serverAPI.callPluginMethod("get_gpuFreqMax", {}).then(res => {
                if (res.success) {
                    console.info("gpuMax = " + res.result);
                    this.gpuMax = res.result;
                    this.has_gpuMax = true;
                }
            });
            await serverAPI.callPluginMethod("get_gpuFreqMin", {}).then(res => {
                if (res.success) {
                    console.info("gpuMin = " + res.result);
                    this.gpuMin = res.result;
                    this.has_gpuMin = true;
                }
            });
            await this.serverAPI.callPluginMethod("get_fanMAXRPM", {}).then(res => {
                if (res.success) {
                    this.fanMaxRPM = res.result;
                    this.has_fanMaxRPM = true;
                }
                else {
                    this.fanMaxRPM = 1;
                }
            });
            await this.serverAPI.callPluginMethod("get_fanIsAdapted", {}).then(res => {
                if (res.success) {
                    this.fanIsAdapted = res.result;
                }
                else {
                    this.fanIsAdapted = false;
                }
            });
        }
        getCpuMaxNum() {
            return this.cpuMaxNum;
        }
        HasCpuMaxNum() {
            return this.has_cpuMaxNum;
        }
        getTDPMax() {
            return this.tdpMax;
        }
        getGPUFreqMax() {
            return this.gpuMax;
        }
        HasGPUFreqMax() {
            return this.has_gpuMax;
        }
        getGPUFreqMin() {
            return this.gpuMin;
        }
        HasGPUFreqMin() {
            return this.has_gpuMin;
        }
        HasTDPMax() {
            return this.has_tdpMax;
        }
        HasRyzenadj() {
            return this.has_ryzenadj;
        }
        getFanMAXPRM() {
            return this.fanMaxRPM;
        }
        HasFanMAXPRM() {
            return this.has_fanMaxRPM;
        }
        getFanIsAdapt() {
            return this.fanIsAdapted;
        }
        async getFanRPM() {
            var fanPRM;
            await this.serverAPI.callPluginMethod("get_fanRPM", {}).then(res => {
                if (res.success) {
                    fanPRM = res.result;
                }
                else {
                    fanPRM = 0;
                }
            });
            return fanPRM;
        }
        async getFanTemp() {
            var fanTemp;
            await this.serverAPI.callPluginMethod("get_fanTemp", {}).then(res => {
                if (res.success) {
                    fanTemp = res.result / 1000;
                }
                else {
                    fanTemp = -1;
                }
            });
            return fanTemp;
        }
        async getFanIsAuto() {
            var fanIsAuto;
            await this.serverAPI.callPluginMethod("get_fanIsAuto", {}).then(res => {
                if (res.success) {
                    fanIsAuto = res.result;
                }
                else {
                    fanIsAuto = false;
                }
            });
            return fanIsAuto;
        }
    }
    class Backend {
        static async init(serverAPI) {
            this.serverAPI = serverAPI;
            this.data = new BackendData();
            await this.data.init(serverAPI);
        }
        static applySmt(smt) {
            console.log("Applying smt " + smt.toString());
            this.serverAPI.callPluginMethod("set_smt", { "value": smt });
        }
        static applyCpuNum(cpuNum) {
            console.log("Applying cpuNum " + cpuNum.toString());
            this.serverAPI.callPluginMethod("set_cpuOnline", { "value": cpuNum });
        }
        static applyCpuBoost(cpuBoost) {
            console.log("Applying cpuBoost " + cpuBoost.toString());
            this.serverAPI.callPluginMethod("set_cpuBoost", { "value": cpuBoost });
        }
        static applyTDP(tdp) {
            console.log("Applying tdp " + tdp.toString());
            this.serverAPI.callPluginMethod("set_cpuTDP", { "value": tdp });
        }
        static applyGPUFreq(freq) {
            console.log("Applying gpuFreq " + freq.toString());
            this.serverAPI.callPluginMethod("set_gpuFreq", { "value": freq });
        }
        static applyGPUFreqRange(freqMin, freqMax) {
            console.log("Applying gpuFreqRange  " + freqMin.toString() + "   " + freqMax.toString());
            this.serverAPI.callPluginMethod("set_gpuFreqRange", { "value": freqMin, "value2": freqMax });
        }
        static applyGPUAuto(auto) {
            console.log("Applying gpuAuto" + auto.toString());
            this.serverAPI.callPluginMethod("set_gpuAuto", { "value": auto });
        }
        static applyGPUAutoMax(maxAutoFreq) {
            console.log("Applying gpuAuto" + maxAutoFreq.toString());
            this.serverAPI.callPluginMethod("set_gpuAutoMaxFreq", { "value": maxAutoFreq });
        }
        static applyGPUAutoMin(minAutoFreq) {
            console.log("Applying gpuAuto" + minAutoFreq.toString());
            this.serverAPI.callPluginMethod("set_gpuAutoMinFreq", { "value": minAutoFreq });
        }
        static applyFanAuto(auto) {
            this.serverAPI.callPluginMethod("set_fanAuto", { "value": auto });
        }
        static applyFanPercent(percent) {
            this.serverAPI.callPluginMethod("set_fanPercent", { "value": percent });
        }
        static throwSuspendEvt() {
            console.log("throwSuspendEvt");
            this.serverAPI.callPluginMethod("receive_suspendEvent", {});
        }
    }
    Backend.applySettings = (applyTarget) => {
        if (!Settings.ensureEnable()) {
            Backend.resetSettings();
            return;
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_CPUCORE) {
            const smt = Settings.appSmt();
            const cpuNum = Settings.appCpuNum();
            Backend.applySmt(smt);
            Backend.applyCpuNum(cpuNum);
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_CPUBOOST) {
            const cpuBoost = Settings.appCpuboost();
            Backend.applyCpuBoost(cpuBoost);
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_TDP) {
            const tdp = Settings.appTDP();
            const tdpEnable = Settings.appTDPEnable();
            if (tdpEnable) {
                Backend.applyTDP(tdp);
            }
            else {
                Backend.applyTDP(Backend.data.getTDPMax());
            }
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_GPUMODE) {
            const gpuMode = Settings.appGPUMode();
            const gpuFreq = Settings.appGPUFreq();
            const gpuAutoMaxFreq = Settings.appGPUAutoMaxFreq();
            const gpuAutoMinFreq = Settings.appGPUAutoMinFreq();
            const gpuRangeMaxFreq = Settings.appGPURangeMaxFreq();
            const gpuRangeMinFreq = Settings.appGPURangeMinFreq();
            if (gpuMode == GPUMODE.NOLIMIT) {
                Backend.applyGPUAuto(false);
                Backend.applyGPUFreq(0);
            }
            else if (gpuMode == GPUMODE.FIX) {
                Backend.applyGPUAuto(false);
                Backend.applyGPUFreq(gpuFreq);
            }
            else if (gpuMode == GPUMODE.AUTO) {
                console.log(`开始自动优化GPU频率`);
                Settings.setTDPEnable(false);
                Settings.setCpuboost(false);
                Backend.applyGPUAutoMax(gpuAutoMaxFreq);
                Backend.applyGPUAutoMin(gpuAutoMinFreq);
                Backend.applyGPUAuto(true);
            }
            else if (gpuMode == GPUMODE.RANGE) {
                Backend.applyGPUAuto(false);
                Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
            }
            else {
                console.log(`出现意外的GPUmode = ${gpuMode}`);
                Backend.applyGPUFreq(0);
            }
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_FANMODE) {
            if (!FanControl.fanIsEnable) {
                return;
            }
            const fanSetting = Settings.appFanSetting();
            const fanMode = fanSetting?.fanMode;
            if (fanMode == FANMODE.NOCONTROL) {
                Backend.applyFanAuto(true);
            }
            else if (fanMode == FANMODE.FIX) {
                Backend.applyFanAuto(false);
            }
            else if (fanMode == FANMODE.CURVE) {
                Backend.applyFanAuto(false);
            }
            else {
                Backend.applyFanAuto(true);
                console.log(`出现意外的FanMode = ${fanMode}`);
            }
        }
        if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_FANRPM) {
            if (!FanControl.fanIsEnable) {
                return;
            }
            const fanSetting = Settings.appFanSetting();
            const fanMode = fanSetting?.fanMode;
            if (fanMode == FANMODE.NOCONTROL) ;
            else if (fanMode == FANMODE.FIX) {
                Backend.applyFanPercent(FanControl.setPoint.fanRPMpercent);
            }
            else if (fanMode == FANMODE.CURVE) {
                Backend.applyFanPercent(FanControl.setPoint.fanRPMpercent);
            }
            else {
                console.log(`出现意外的FanMode = ${fanMode}`);
            }
        }
    };
    Backend.resetFanSettings = () => {
        Backend.applyFanAuto(true);
    };
    Backend.resetSettings = () => {
        console.log("重置所有设置");
        Backend.applySmt(true);
        Backend.applyCpuNum(Backend.data.getCpuMaxNum());
        Backend.applyCpuBoost(true);
        Backend.applyTDP(Backend.data.getTDPMax());
        Backend.applyGPUFreq(0);
        Backend.applyFanAuto(true);
    };

    const SlowSliderField = (slider) => {
        const [changeValue, SetChangeValue] = React.useState(slider.value);
        const isChanging = React.useRef(false);
        React.useEffect(() => {
            setTimeout(() => {
                //console.debug("changeValue=",changeValue,"slider=",slider.value)
                if (changeValue == slider.value) {
                    slider.onChangeEnd?.call(slider, slider.value);
                    isChanging.current = false;
                }
            }, 500);
        }, [changeValue]);
        return (window.SP_REACT.createElement(SliderField, { value: slider.value, label: slider.label, description: slider.description, min: slider.min, max: slider.max, step: slider.step, notchCount: slider.notchCount, notchLabels: slider.notchLabels, notchTicksVisible: slider.notchTicksVisible, showValue: slider.showValue, resetValue: slider.resetValue, disabled: slider.disabled, editableValue: slider.editableValue, validValues: slider.validValues, valueSuffix: slider.valueSuffix, minimumDpadGranularity: slider.minimumDpadGranularity, onChange: (value) => {
                var tpvalue = value;
                if (slider.changeMax != undefined)
                    tpvalue = slider.changeMax <= value ? slider.changeMax : value;
                if (slider.changeMin != undefined)
                    tpvalue = slider.changeMin >= value ? slider.changeMin : value;
                isChanging.current = true;
                slider.onChange?.call(slider, tpvalue);
                slider.value = tpvalue;
                SetChangeValue(tpvalue);
            } }));
    };

    //GPUFreq模块
    const GPUFreqComponent = () => {
        const [gpuFreq, setGPUFreq] = React.useState(Settings.appGPUFreq());
        const refresh = () => {
            setGPUFreq(Settings.appGPUFreq());
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.GPU_FREQFIX, [ComponentName.GPU_FREQFIX], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.FIXED_FREQ), value: gpuFreq, step: 50, max: Backend.data.getGPUFreqMax(), min: Backend.data.getGPUFreqMin(), disabled: !Backend.data.HasGPUFreqMax(), showValue: true, onChangeEnd: (value) => {
                    Settings.setGPUFreq(value);
                } })));
    };
    //GPURange模块
    const GPURangeComponent = () => {
        const [gpuRangeMaxFreq, setGPURangeMaxFreq] = React.useState(Settings.appGPURangeMaxFreq());
        const [gpuRangeMinFreq, setGPURangeMinFreq] = React.useState(Settings.appGPURangeMinFreq());
        //GPURange设置
        const refresh = () => {
            setGPURangeMaxFreq(Settings.appGPURangeMaxFreq());
            setGPURangeMinFreq(Settings.appGPURangeMinFreq());
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.GPU_FREQRANGE, [ComponentName.GPU_FREQRANGE], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.GPU_MAX_FREQ), value: gpuRangeMaxFreq, step: 50, max: Backend.data.getGPUFreqMax(), min: Backend.data.getGPUFreqMin(), changeMin: gpuRangeMinFreq, disabled: !Backend.data.HasGPUFreqMax(), showValue: true, onChangeEnd: (value) => {
                        Settings.setGPURangeFreq(value, gpuRangeMinFreq);
                    } })),
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.GPU_MIN_FREQ), value: gpuRangeMinFreq, step: 50, max: Backend.data.getGPUFreqMax(), min: Backend.data.getGPUFreqMin(), changeMax: gpuRangeMaxFreq, disabled: !Backend.data.HasGPUFreqMax(), showValue: true, onChangeEnd: (value) => {
                        Settings.setGPURangeFreq(gpuRangeMaxFreq, value);
                    } }))));
    };
    //GPUAutoMax模块
    const GPUAutoComponent = () => {
        const [gpuAutoMaxFreq, setGPUAutoMaxFreq] = React.useState(Settings.appGPUAutoMaxFreq());
        const [gpuAutoMinFreq, setGPUAutoMinFreq] = React.useState(Settings.appGPUAutoMinFreq());
        const refresh = () => {
            setGPUAutoMaxFreq(Settings.appGPUAutoMaxFreq());
            setGPUAutoMinFreq(Settings.appGPUAutoMinFreq());
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.GPU_FREQAUTO, [ComponentName.GPU_FREQAUTO], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.GPU_MAX_FREQ), value: gpuAutoMaxFreq, step: 50, max: Backend.data.getGPUFreqMax(), min: Backend.data.getGPUFreqMin(), changeMin: gpuAutoMinFreq, disabled: !Backend.data.HasGPUFreqMax(), showValue: true, onChangeEnd: (value) => {
                        Settings.setGPUAutoMaxFreq(value);
                    } })),
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.GPU_MIN_FREQ), value: gpuAutoMinFreq, step: 50, max: Backend.data.getGPUFreqMax(), min: Backend.data.getGPUFreqMin(), changeMax: gpuAutoMaxFreq, disabled: !Backend.data.HasGPUFreqMax(), showValue: true, onChangeEnd: (value) => {
                        Settings.setGPUAutoMinFreq(value);
                    } }))));
    };
    const GPUModeComponent = () => {
        const [gpuMode, setGPUMode] = React.useState(Settings.appGPUMode());
        //GPU模式设置
        const refresh = () => {
            setGPUMode(Settings.appGPUMode());
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.GPU_FREQMODE, [ComponentName.GPU_FREQMODE], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SliderField, { label: localizationManager.getString(localizeStrEnum.GPU_FREQMODE), value: gpuMode, step: 1, max: 3, min: 0, notchCount: 4, notchLabels: [{
                            notchIndex: GPUMODE.NOLIMIT,
                            label: `${localizationManager.getString(localizeStrEnum.UNLIMITED)}`,
                            value: GPUMODE.NOLIMIT,
                        }, {
                            notchIndex: GPUMODE.FIX,
                            label: `${localizationManager.getString(localizeStrEnum.FIXED_FREQ)}`,
                            value: GPUMODE.FIX,
                        }, {
                            notchIndex: GPUMODE.RANGE,
                            label: `${localizationManager.getString(localizeStrEnum.RANGE_FREQ)}`,
                            value: GPUMODE.RANGE,
                        }, {
                            notchIndex: GPUMODE.AUTO,
                            label: `${localizationManager.getString(localizeStrEnum.AUTO_FREQ)}`,
                            value: GPUMODE.AUTO,
                        }
                    ], onChange: (value) => {
                        Settings.setGPUMode(value);
                    } }),
                gpuMode == GPUMODE.FIX && window.SP_REACT.createElement(GPUFreqComponent, null),
                gpuMode == GPUMODE.RANGE && window.SP_REACT.createElement(GPURangeComponent, null),
                gpuMode == GPUMODE.AUTO && window.SP_REACT.createElement(GPUAutoComponent, null))));
    };
    function GPUComponent() {
        const [show, setShow] = React.useState(Settings.ensureEnable());
        const hide = (ishide) => {
            setShow(!ishide);
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.GPU_ALL, [ComponentName.GPU_ALL], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.HIDE): {
                        hide(true);
                        break;
                    }
                    case (UpdateType.SHOW): {
                        hide(false);
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null, show && window.SP_REACT.createElement(PanelSection, { title: "GPU" },
            window.SP_REACT.createElement(GPUModeComponent, null))));
    }

    const CPUBoostComponent = () => {
        const [cpuboost, setCPUBoost] = React.useState(Settings.appCpuboost());
        const [disabled, setDisable] = React.useState(Settings.appGPUMode() == GPUMODE.AUTO);
        const refresh = () => {
            setCPUBoost(Settings.appCpuboost());
            setDisable(Settings.appGPUMode() == GPUMODE.AUTO);
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.CPU_BOOST, [ComponentName.CPU_BOOST, ComponentName.GPU_FREQMODE], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(ToggleField, { label: localizationManager.getString(localizeStrEnum.CPU_BOOST), description: localizationManager.getString(localizeStrEnum.CPU_BOOST_DESC), disabled: disabled, checked: cpuboost, onChange: (value) => {
                        Settings.setCpuboost(value);
                    } }))));
    };
    const CPUSmtComponent = () => {
        const [cpusmt, setCPUSmt] = React.useState(Settings.appSmt());
        const refresh = () => {
            setCPUSmt(Settings.appSmt());
        };
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.CPU_SMT, [ComponentName.CPU_SMT], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(ToggleField, { label: "SMT", description: localizationManager.getString(localizeStrEnum.SMT_DESC), checked: cpusmt, onChange: (smt) => {
                        Settings.setSmt(smt);
                    } }))));
    };
    const CPUNumComponent = () => {
        const [cpunum, setCPUNum] = React.useState(Settings.appCpuNum());
        const refresh = () => {
            setCPUNum(Settings.appCpuNum());
        };
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.CPU_NUM, [ComponentName.CPU_NUM], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.CPU_NUM), description: localizationManager.getString(localizeStrEnum.CPU_NUM_DESC), value: cpunum, step: 1, max: Backend.data.getCpuMaxNum(), min: 1, disabled: !Backend.data.HasCpuMaxNum(), showValue: true, onChangeEnd: (value) => {
                        Settings.setCpuNum(value);
                    } }))));
    };
    const CPUTDPComponent = () => {
        const [tdpEnable, setTDPEnable] = React.useState(Settings.appTDPEnable());
        const [tdp, setTDP] = React.useState(Settings.appTDP());
        const [disabled, setDisable] = React.useState(!Backend.data.HasRyzenadj() || Settings.appGPUMode() == GPUMODE.AUTO);
        const refresh = () => {
            setTDPEnable(Settings.appTDPEnable());
            setTDP(Settings.appTDP());
            setDisable(!Backend.data.HasRyzenadj() || Settings.appGPUMode() == GPUMODE.AUTO);
        };
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.CPU_TDP, [ComponentName.CPU_TDP, ComponentName.GPU_FREQMODE], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(ToggleField, { label: localizationManager.getString(localizeStrEnum.TDP), description: Backend.data.HasRyzenadj() ? localizationManager.getString(localizeStrEnum.TDP_DESC) : localizationManager.getString(localizeStrEnum.RYZENADJ_NOT_FOUND), checked: tdpEnable, disabled: disabled, onChange: (value) => {
                        Settings.setTDPEnable(value);
                    } })),
            tdpEnable && window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SlowSliderField, { label: localizationManager.getString(localizeStrEnum.WATTS), value: tdp, step: 1, max: Backend.data.getTDPMax(), min: 3, disabled: disabled, showValue: true, onChangeEnd: (value) => {
                        Settings.setTDP(value);
                    } }))));
    };
    const CPUComponent = () => {
        const [show, setShow] = React.useState(Settings.ensureEnable());
        const hide = (ishide) => {
            setShow(!ishide);
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.CPU_ALL, [ComponentName.CPU_ALL], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.HIDE): {
                        hide(true);
                        break;
                    }
                    case (UpdateType.SHOW): {
                        hide(false);
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null, show && window.SP_REACT.createElement(PanelSection, { title: "CPU" },
            window.SP_REACT.createElement(CPUBoostComponent, null),
            window.SP_REACT.createElement(CPUSmtComponent, null),
            window.SP_REACT.createElement(CPUNumComponent, null),
            window.SP_REACT.createElement(CPUTDPComponent, null))));
    };

    const SettingsEnableComponent = () => {
        const [enable, setEnable] = React.useState(Settings.ensureEnable());
        const refresh = () => {
            setEnable(Settings.ensureEnable());
        };
        //listen Settings
        React.useEffect(() => {
            if (!enable) {
                PluginManager.updateAllComponent(UpdateType.HIDE);
            }
            else {
                PluginManager.updateAllComponent(UpdateType.SHOW);
            }
            PluginManager.listenUpdateComponent(ComponentName.SET_ENABLE, [ComponentName.SET_ENABLE], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(ToggleField, { label: localizationManager.getString(localizeStrEnum.ENABLE_SETTINGS), checked: enable, onChange: (enabled) => {
                        Settings.setEnable(enabled);
                    } }))));
    };
    const SettingsPerAppComponent = () => {
        const [override, setOverWrite] = React.useState(Settings.appOverWrite());
        const [overrideable, setOverWriteable] = React.useState(RunningApps.active() != DEFAULT_APP);
        const [show, setShow] = React.useState(Settings.ensureEnable());
        const hide = (ishide) => {
            setShow(!ishide);
        };
        const refresh = () => {
            setOverWrite(Settings.appOverWrite());
            setOverWriteable(RunningApps.active() != DEFAULT_APP);
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.SET_PERAPP, [ComponentName.SET_PERAPP], (_ComponentName, updateType) => {
                switch (updateType) {
                    case UpdateType.UPDATE:
                        refresh();
                        //console.log(`fn:invoke refresh:${updateType} ${UpdateType.UPDATE}`)
                        break;
                    case UpdateType.SHOW:
                        hide(false);
                        //console.log(`fn:invoke show:${updateType} ${UpdateType.SHOW}`)
                        break;
                    case UpdateType.HIDE:
                        hide(true);
                        //console.log(`fn:invoke hide:${updateType} ${UpdateType.HIDE}`)
                        break;
                }
            });
        }, []);
        return (window.SP_REACT.createElement("div", null, show && window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(ToggleField, { label: localizationManager.getString(localizeStrEnum.USE_PERGAME_PROFILE), description: window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "left" } },
                    window.SP_REACT.createElement("img", { src: RunningApps.active_appInfo()?.icon_data ? "data:image/" + RunningApps.active_appInfo()?.icon_data_format + ";base64," + RunningApps.active_appInfo()?.icon_data : "/assets/" + RunningApps.active_appInfo()?.appid + "_icon.jpg?v=" + RunningApps.active_appInfo()?.icon_hash, width: 20, height: 20, style: { paddingRight: "5px", display: override && overrideable ? "block" : "none" } }),
                    window.SP_REACT.createElement("div", { style: { lineHeight: "20px", whiteSpace: "pre" } }, localizationManager.getString(localizeStrEnum.USING) + (override && overrideable ? "『" : "")),
                    window.SP_REACT.createElement(Marquee, { play: true, fadeLength: 10, delay: 1, style: {
                            maxWidth: "100px",
                            lineHeight: "20px",
                            whiteSpace: "pre",
                        } }, (override && overrideable ? `${RunningApps.active_appInfo()?.display_name}` : `${localizationManager.getString(localizeStrEnum.DEFAULT)}`)),
                    window.SP_REACT.createElement("div", { style: { lineHeight: "20px", whiteSpace: "pre", } }, (override && overrideable ? "』" : "") + localizationManager.getString(localizeStrEnum.PROFILE))), checked: override && overrideable, disabled: !overrideable, onChange: (override) => {
                    Settings.setOverWrite(override);
                } }))));
    };
    const SettingsComponent = () => {
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement(PanelSection, { title: localizationManager.getString(localizeStrEnum.TITEL_SETTINGS) },
                window.SP_REACT.createElement(SettingsEnableComponent, null),
                window.SP_REACT.createElement(SettingsPerAppComponent, null))));
    };

    const FanCanvas = (canvas) => {
        const pointerDownPos = React.useRef(null);
        const pointerDownTime = React.useRef(null);
        const pointerUpPos = React.useRef(null);
        const pointerUpTime = React.useRef(null);
        const pointerIsDrag = React.useRef(false);
        const canvasRef = React.useRef(null);
        React.useEffect(() => {
            canvas.initDraw?.call(canvas, canvasRef.current);
        }, []);
        function onPointerDown(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            pointerDownPos.current = [realEvent.layerX, realEvent.layerY];
            pointerDownTime.current = Date.parse(new Date().toString());
            canvas.onPointerDown?.call(canvas, fanClickPos);
            onDragDown(e);
        }
        function onPointerUp(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            pointerUpPos.current = [realEvent.layerX, realEvent.layerY];
            pointerUpTime.current = Date.parse(new Date().toString());
            canvas.onPointerUp?.call(canvas, fanClickPos);
            //call PointPressEvent
            if (approximatelyEqual(pointerDownPos.current[0], pointerUpPos.current[0], 3) && approximatelyEqual(pointerDownPos.current[1], pointerUpPos.current[1], 3)) {
                if (pointerUpTime.current - pointerDownTime.current <= 1000)
                    onPointerShortPress(e);
            }
            //console.log(`pressDownTime=${pointerDownTime.current} pressUpTime=${pointerUpTime.current}`)
            if (pointerIsDrag.current) {
                pointerIsDrag.current = false;
            }
        }
        function onPointerMove(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            canvas.onPointerMove?.call(canvas, fanClickPos);
            if (pointerIsDrag.current) {
                onDraging(e);
            }
        }
        function onPointerLeave(_e) {
            if (pointerIsDrag.current) {
                pointerIsDrag.current = false;
            }
        }
        function onPointerShortPress(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            canvas.onPointerShortPress?.call(canvas, fanClickPos);
        }
        function onDragDown(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            pointerIsDrag.current = canvas.onPointerDragDown?.call(canvas, fanClickPos);
        }
        function onDraging(e) {
            const realEvent = e.nativeEvent;
            const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX, realEvent.layerY, canvas.width, canvas.height);
            canvas.onPointerDraging?.call(canvas, fanClickPos);
        }
        const { ...option } = canvas;
        return (window.SP_REACT.createElement("canvas", { ref: canvasRef, 
            //onClick={(e: any) => onClickCanvas(e)}
            onPointerDown: (e) => { onPointerDown(e); }, onPointerMove: (e) => { onPointerMove(e); }, onPointerUp: (e) => { onPointerUp(e); }, onPointerLeave: (e) => { onPointerLeave(); }, ...option }));
    };
    const approximatelyEqual = (a, b, error) => {
        return Math.abs(b - a) <= error;
    };

    var fanRPMIntervalID;
    var fanDisplayIntervalID;
    const totalLines = 9;
    const pointBlockDis = 5;
    const pointColor = "#1A9FFF";
    const selectColor = "#FF0000";
    const textColor = "#FFFFFF";
    const lineColor = "#1E90FF";
    const setPointColor = "#00BFFF";
    //选择配置文件下拉框
    const FANSelectProfileComponent = () => {
        //@ts-ignore
        const [items, setItems] = React.useState(Object.entries(Settings.getFanSettings()).map(([profileName, fanSetting]) => ({
            label: profileName,
            options: [
                { label: localizationManager.getString(localizeStrEnum.USE), data: { profileName: profileName, type: FANPROFILEACTION.USE, setting: fanSetting } },
                { label: localizationManager.getString(localizeStrEnum.DELETE), data: { profileName: profileName, type: FANPROFILEACTION.DELETE, setting: fanSetting } },
            ]
        })));
        //@ts-ignore
        const [selectedItem, setSelectedItem] = React.useState(items.find((item) => {
            return item.label == Settings.appFanSettingName();
        }));
        return (window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(Dropdown, { focusable: true, disabled: items.length == 0, rgOptions: items, strDefaultLabel: selectedItem ? selectedItem.label?.toString() : (items.length == 0 ? localizationManager.getString(localizeStrEnum.CREATE_FAN_PROFILE_TIP) : localizationManager.getString(localizeStrEnum.SELECT_FAN_PROFILE_TIP)), selectedOption: selectedItem, onChange: (item) => {
                    //setSelectedItem(item);
                    if (item.data.type == FANPROFILEACTION.USE) {
                        Settings.setAppFanSettingName(item.data.profileName);
                    }
                    else if (item.data.type == FANPROFILEACTION.DELETE) {
                        Settings.removeFanSetting(item.data.profileName);
                    }
                } })));
    };
    //显示当前风扇配置和温度转速信息
    const FANDisplayComponent = () => {
        const canvasRef = React.useRef(null);
        const curvePoints = React.useRef([]);
        const initDraw = (ref) => {
            canvasRef.current = ref;
            curvePoints.current = Settings.appFanSetting()?.curvePoints;
        };
        const refresh = () => {
            refreshCanvas();
        };
        const dismount = () => {
            if (fanDisplayIntervalID != null) {
                clearInterval(fanDisplayIntervalID);
            }
        };
        React.useEffect(() => {
            refresh();
            if (fanDisplayIntervalID != null) {
                clearInterval(fanDisplayIntervalID);
            }
            fanDisplayIntervalID = setInterval(() => {
                refresh();
            }, 1000);
            PluginManager.listenUpdateComponent(ComponentName.FAN_DISPLAY, [ComponentName.FAN_DISPLAY], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.UPDATE): {
                        refresh();
                        break;
                    }
                    case (UpdateType.DISMOUNT): {
                        dismount();
                        break;
                    }
                }
            });
        }, []);
        const refreshCanvas = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const lineDistance = 1 / (totalLines + 1);
            ctx.clearRect(0, 0, width, height);
            //网格绘制
            ctx.beginPath();
            ctx.strokeStyle = "#093455";
            for (let i = 1; i <= totalLines + 1; i++) {
                ctx.moveTo(lineDistance * i * width, 0);
                ctx.lineTo(lineDistance * i * width, height);
                ctx.moveTo(0, lineDistance * i * height);
                ctx.lineTo(width, lineDistance * i * height);
            }
            ctx.stroke();
            //文字绘制
            /*
            ctx.beginPath();
            ctx.fillStyle = "#FFFFFF";
            for (let i = 1; i <= totalLines + 1; i++) {
              const tempText= tempMax / (totalLines + 1) * i +"°C";
              const fanText= fanMax / (totalLines + 1) * i +"%";
              ctx.textAlign = "right";
              ctx.fillText(tempText, lineDistance * i * width - 2, height - 2);
              ctx.textAlign = "left";
              ctx.fillText(fanText, 2, height-lineDistance * i * height + 10);
            }
            ctx.stroke();*/
            switch (Settings.appFanSetting()?.fanMode) {
                case (FANMODE.NOCONTROL): {
                    drawNoControlMode();
                    break;
                }
                case (FANMODE.FIX): {
                    drawFixMode();
                    break;
                }
                case (FANMODE.CURVE): {
                    drawCurveMode();
                    break;
                }
            }
        };
        const drawNoControlMode = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            ctx.beginPath();
            ctx.fillStyle = setPointColor;
            ctx.textAlign = "left";
            ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT), 22, 16);
            ctx.arc(12, 12, 5, 0, Math.PI * 2);
            ctx.fill();
            //绘制实际点
            ctx.fillStyle = setPointColor;
            var nowPointCanPos = FanControl.nowPoint.getCanvasPos(width, height);
            var textPos = getTextPosByCanvasPos(nowPointCanPos[0], nowPointCanPos[1], width);
            ctx.fillText(`(${Math.trunc(FanControl.nowPoint.temperature)}°C,${Math.trunc(FanControl.nowPoint.fanRPMpercent)}%)`, textPos[0], textPos[1]);
            ctx.arc(nowPointCanPos[0], nowPointCanPos[1], 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
        };
        const drawFixMode = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const anchorPoint = new fanPosition(fanPosition.tempMax / 2, Settings.appFanSetting()?.fixSpeed).getCanvasPos(width, height);
            //说明绘制
            ctx.beginPath();
            ctx.fillStyle = setPointColor;
            ctx.textAlign = "left";
            ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT), 22, 16);
            ctx.arc(12, 12, 5, 0, Math.PI * 2);
            ctx.fill();
            //点线绘制
            var lineStart = [0, anchorPoint[1]];
            var lineEnd = [width, anchorPoint[1]];
            var textPos = getTextPosByCanvasPos(anchorPoint[0], anchorPoint[1], width);
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            //ctx.fillText(`(${Math.trunc(Settings.appFanSetting()?.fixSpeed!!!!)}%)`, textPos[0],textPos[1]);
            ctx.moveTo(lineStart[0], lineStart[1]);
            ctx.lineTo(lineEnd[0], lineEnd[1]);
            ctx.stroke();
            //绘制设置点
            ctx.beginPath();
            ctx.fillStyle = setPointColor;
            var setPointCanPos = FanControl.setPoint.getCanvasPos(width, height);
            var textPos = getTextPosByCanvasPos(setPointCanPos[0], setPointCanPos[1], width);
            ctx.fillText(`(${Math.trunc(FanControl.setPoint.temperature)}°C,${Math.trunc(FanControl.setPoint.fanRPMpercent)}%)`, textPos[0], textPos[1]);
            ctx.arc(setPointCanPos[0], setPointCanPos[1], 5, 0, Math.PI * 2);
            ctx.fill();
        };
        const drawCurveMode = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            curvePoints.current = curvePoints.current.sort((a, b) => {
                return a.temperature == b.temperature ? a.fanRPMpercent - b.fanRPMpercent : a.temperature - b.temperature;
            });
            //说明绘制
            ctx.beginPath();
            ctx.fillStyle = setPointColor;
            ctx.textAlign = "left";
            ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT), 22, 16);
            ctx.arc(12, 12, 5, 0, Math.PI * 2);
            ctx.fill();
            //绘制线段
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.strokeStyle = lineColor;
            for (let pointIndex = 0; pointIndex < curvePoints.current.length; pointIndex++) {
                var curvePoint = curvePoints.current[pointIndex];
                var pointCanvasPos = curvePoint.getCanvasPos(width, height);
                ctx.lineTo(pointCanvasPos[0], pointCanvasPos[1]);
                ctx.moveTo(pointCanvasPos[0], pointCanvasPos[1]);
            }
            ctx.lineTo(width, 0);
            ctx.stroke();
            //绘制实际点和设置点
            ctx.beginPath();
            ctx.fillStyle = setPointColor;
            var setPointCanPos = FanControl.setPoint.getCanvasPos(width, height);
            var textPos = getTextPosByCanvasPos(setPointCanPos[0], setPointCanPos[1], width);
            ctx.fillText(`(${Math.trunc(FanControl.setPoint.temperature)}°C,${Math.trunc(FanControl.setPoint.fanRPMpercent)}%)`, textPos[0], textPos[1]);
            ctx.arc(setPointCanPos[0], setPointCanPos[1], 5, 0, Math.PI * 2);
            ctx.fill();
            //绘制点和坐标
            /*
            for(let pointIndex = 0; pointIndex < curvePoints.current.length;pointIndex++){
              var curvePoint = curvePoints.current[pointIndex];
              var pointCanvasPos = curvePoint.getCanvasPos(width,height);
              var textPox = getTextPosByCanvasPos(pointCanvasPos[0],pointCanvasPos[1],width,height)
              ctx.beginPath();
              ctx.fillStyle = curvePoint == selectedPoint.current?selectColor:pointColor;
              ctx.arc(pointCanvasPos[0],pointCanvasPos[1],8, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.fillStyle = textColor;
              ctx.fillText(`(${Math.trunc(curvePoint.temperature!!)}°C,${Math.trunc(curvePoint.fanRPMpercent!!)}%)`, textPox[0],textPox[1]);
              ctx.fill();
            }
            */
        };
        return (window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(FanCanvas, { width: 250, height: 250, style: {
                    "width": "250px",
                    "height": "250px",
                    "border": "1px solid #1a9fff",
                    "padding": "0px",
                    // @ts-ignore
                    "background-color": "#1a1f2c",
                    "border-radius": "4px",
                    "margin-top": "10px",
                    "margin-left": "8px"
                }, initDraw: (f) => { initDraw(f); } })));
    };
    //FANRPM模块
    const FANRPMComponent = () => {
        const [fanrpm, setFanRPM] = React.useState(0);
        const refresh = async () => {
            setFanRPM(FanControl.fanRPM);
        };
        const dismount = () => {
            if (fanRPMIntervalID != null) {
                clearInterval(fanRPMIntervalID);
            }
        };
        React.useEffect(() => {
            if (fanRPMIntervalID != null) {
                clearInterval(fanRPMIntervalID);
            }
            fanRPMIntervalID = setInterval(() => {
                refresh();
            }, 1000);
            PluginManager.listenUpdateComponent(ComponentName.FAN_RPM, [ComponentName.FAN_RPM], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.DISMOUNT): {
                        dismount();
                        break;
                    }
                }
            });
        }, []);
        return (window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(Field, { label: localizationManager.getString(localizeStrEnum.FAN_SPEED) }, fanrpm + " RPM")));
    };
    const FANCreateProfileComponent = () => {
        return (window.SP_REACT.createElement(PanelSectionRow, null,
            window.SP_REACT.createElement(ButtonItem, { layout: "below", onClick: () => {
                    // @ts-ignore
                    showModal(window.SP_REACT.createElement(FANCretateProfileModelComponent, null));
                } }, localizationManager.getString(localizeStrEnum.CREATE_FAN_PROFILE))));
    };
    function FANCretateProfileModelComponent({ closeModal, }) {
        const canvasRef = React.useRef(null);
        const curvePoints = React.useRef([]);
        //drag
        const dragPoint = React.useRef(null);
        //select
        const selectedPoint = React.useRef(null);
        const [profileName, setProfileName] = React.useState();
        //@ts-ignore
        const [snapToGrid, setSnapToGrid] = React.useState(true);
        const [fanMode, setFanMode] = React.useState(FANMODE.NOCONTROL);
        const [fixSpeed, setFixSpeed] = React.useState(50);
        const [selPointTemp, setSelPointTemp] = React.useState(0);
        const [selPointSpeed, setSelPointSpeed] = React.useState(0);
        const initDraw = (ref) => {
            canvasRef.current = ref;
        };
        const refreshCanvas = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const lineDistance = 1 / (totalLines + 1);
            ctx.clearRect(0, 0, width, height);
            //网格绘制
            ctx.beginPath();
            ctx.strokeStyle = "#093455";
            for (let i = 1; i <= totalLines + 1; i++) {
                ctx.moveTo(lineDistance * i * width, 0);
                ctx.lineTo(lineDistance * i * width, height);
                ctx.moveTo(0, lineDistance * i * height);
                ctx.lineTo(width, lineDistance * i * height);
            }
            ctx.stroke();
            //文字绘制
            ctx.beginPath();
            ctx.fillStyle = "#FFFFFF";
            for (let i = 1; i <= totalLines + 1; i++) {
                const tempText = fanPosition.tempMax / (totalLines + 1) * i + "°C";
                const fanText = fanPosition.fanMax / (totalLines + 1) * i + "%";
                ctx.textAlign = "right";
                ctx.fillText(tempText, lineDistance * i * width - 2, height - 2);
                ctx.textAlign = "left";
                ctx.fillText(fanText, 2, height - lineDistance * i * height + 10);
            }
            ctx.stroke();
            switch (fanMode) {
                case (FANMODE.NOCONTROL): {
                    break;
                }
                case (FANMODE.FIX): {
                    drawFixMode();
                    break;
                }
                case (FANMODE.CURVE): {
                    drawCurveMode();
                    break;
                }
            }
        };
        const drawFixMode = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            const anchorPoint = new fanPosition(fanPosition.tempMax / 2, fixSpeed).getCanvasPos(width, height);
            var lineStart = [0, anchorPoint[1]];
            var lineEnd = [width, anchorPoint[1]];
            var textPos = getTextPosByCanvasPos(anchorPoint[0], anchorPoint[1], width);
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.fillText(`(${Math.trunc(fixSpeed)}%)`, textPos[0], textPos[1]);
            ctx.moveTo(lineStart[0], lineStart[1]);
            ctx.lineTo(lineEnd[0], lineEnd[1]);
            ctx.stroke();
        };
        const drawCurveMode = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            curvePoints.current = curvePoints.current.sort((a, b) => {
                return a.temperature == b.temperature ? a.fanRPMpercent - b.fanRPMpercent : a.temperature - b.temperature;
            });
            //绘制线段
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.strokeStyle = lineColor;
            for (let pointIndex = 0; pointIndex < curvePoints.current.length; pointIndex++) {
                var curvePoint = curvePoints.current[pointIndex];
                var pointCanvasPos = curvePoint.getCanvasPos(width, height);
                ctx.lineTo(pointCanvasPos[0], pointCanvasPos[1]);
                ctx.moveTo(pointCanvasPos[0], pointCanvasPos[1]);
            }
            ctx.lineTo(width, 0);
            ctx.stroke();
            //绘制点和坐标
            for (let pointIndex = 0; pointIndex < curvePoints.current.length; pointIndex++) {
                var curvePoint = curvePoints.current[pointIndex];
                var pointCanvasPos = curvePoint.getCanvasPos(width, height);
                var textPox = getTextPosByCanvasPos(pointCanvasPos[0], pointCanvasPos[1], width);
                ctx.beginPath();
                ctx.fillStyle = curvePoint == selectedPoint.current ? selectColor : pointColor;
                ctx.arc(pointCanvasPos[0], pointCanvasPos[1], 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = textColor;
                ctx.fillText(`(${Math.trunc(curvePoint.temperature)}°C,${Math.trunc(curvePoint.fanRPMpercent)}%)`, textPox[0], textPox[1]);
                ctx.fill();
            }
        };
        const onCreateProfile = () => {
            return Settings.addFanSetting(profileName, new FanSetting(snapToGrid, fanMode, fixSpeed, curvePoints.current));
        };
        React.useEffect(() => {
            refreshCanvas();
        }, [snapToGrid, fanMode, fixSpeed]);
        React.useEffect(() => {
            if (selectedPoint.current) {
                selectedPoint.current.temperature = selPointTemp;
                selectedPoint.current.fanRPMpercent = selPointSpeed;
                refreshCanvas();
            }
        }, [selPointTemp, selPointSpeed]);
        React.useEffect(() => {
            refreshCanvas();
        }, []);
        function onPointerShortPress(shortPressPos) {
            switch (fanMode) {
                case (FANMODE.NOCONTROL):            case (FANMODE.FIX): {
                    var percent = shortPressPos.fanRPMpercent;
                    setFixSpeed(percent);
                    break;
                }
                case (FANMODE.CURVE): {
                    var isPressPoint = false;
                    //短按时如果按到点 删除该点 
                    //如果该点是选中点 取消选中
                    for (let i = 0; i < curvePoints.current.length; i++) {
                        if (curvePoints.current[i].isCloseToOther(shortPressPos, pointBlockDis)) {
                            if (curvePoints.current[i] == selectedPoint.current) {
                                selectedPoint.current = null;
                                setSelPointTemp(0);
                                setSelPointSpeed(0);
                            }
                            curvePoints.current.splice(i, 1);
                            isPressPoint = true;
                            break;
                        }
                    }
                    //没有按到点 在该位置生成一个点
                    if (!isPressPoint)
                        curvePoints.current.push(shortPressPos);
                    /*
                    //选中点时再点击则取消该点,点击其他位置则取消当前选中
                    if(selectedPoint.current){
                      for(let i=0;i<curvePoints.current.length;i++){
                        if(shortPressPos.isCloseToOther(selectedPoint.current,pointBlockDis)&&curvePoints.current[i]==selectedPoint.current){
                          curvePoints.current.splice(i,1);
                          break;
                        }
                      }
                      selectedPoint.current = null;
                      setSelPointTemp(0);
                      setSelPointSpeed(0);
                    }else{
                      //没有选中点时，获取选中的点
                      for(let i=0;i<curvePoints.current.length;i++){
                        if(curvePoints.current[i].isCloseToOther(shortPressPos,pointBlockDis)){
                          selectedPoint.current = curvePoints.current[i];
                          setSelPointTemp(selectedPoint.current.temperature);
                          setSelPointSpeed(selectedPoint.current.fanRPMpercent);
                          break;
                        }
                      }
                      if(!selectedPoint.current){
                        curvePoints.current.push(shortPressPos);
                      }
                    }*/
                    refreshCanvas();
                    break;
                }
            }
        }
        function onPointerLongPress(longPressPos) {
            switch (fanMode) {
                case (FANMODE.NOCONTROL): {
                    break;
                }
                case (FANMODE.FIX): {
                    var percent = longPressPos.fanRPMpercent;
                    setFixSpeed(percent);
                    break;
                }
                case (FANMODE.CURVE): {
                    //长按时按到点 则选中该点
                    for (let i = 0; i < curvePoints.current.length; i++) {
                        if (longPressPos.isCloseToOther(curvePoints.current[i], pointBlockDis)) {
                            selectedPoint.current = curvePoints.current[i];
                            setSelPointTemp(Math.trunc(selectedPoint.current.temperature));
                            setSelPointSpeed(Math.trunc(selectedPoint.current.fanRPMpercent));
                            break;
                        }
                    }
                    /*
                    //选中点时如果长按该点 则取消选中
                    if(selectedPoint.current){
                      for(let i=0;i<curvePoints.current.length;i++){
                        if(longPressPos.isCloseToOther(selectedPoint.current,pointBlockDis)&&curvePoints.current[i]==selectedPoint.current){
                          curvePoints.current.splice(i,1);
                          break;
                        }
                      }
                      selectedPoint.current = null;
                      setSelPointTemp(0);
                      setSelPointSpeed(0);
                    }else{
                      //没有选中点时，获取选中的点
                      for(let i=0;i<curvePoints.current.length;i++){
                        if(curvePoints.current[i].isCloseToOther(shortPressPos,pointBlockDis)){
                          selectedPoint.current = curvePoints.current[i];
                          setSelPointTemp(selectedPoint.current.temperature);
                          setSelPointSpeed(selectedPoint.current.fanRPMpercent);
                          break;
                        }
                      }
                      if(!selectedPoint.current){
                        curvePoints.current.push(shortPressPos);
                      }
                    }*/
                    refreshCanvas();
                    break;
                }
            }
        }
        function onPointerDragDown(dragDownPos) {
            switch (fanMode) {
                case (FANMODE.NOCONTROL): {
                    return false;
                }
                case (FANMODE.FIX): {
                    if (Math.abs(dragDownPos.fanRPMpercent - fixSpeed) <= 3)
                        return true;
                }
                case (FANMODE.CURVE):
                    {
                        for (let i = 0; i < curvePoints.current.length; i++) {
                            if (curvePoints.current[i].isCloseToOther(dragDownPos, pointBlockDis)) {
                                dragPoint.current = curvePoints.current[i];
                                return true;
                            }
                        }
                    }
                    return false;
            }
        }
        function onPointerDraging(fanClickPos) {
            switch (fanMode) {
                case (FANMODE.NOCONTROL):            case (FANMODE.FIX): {
                    setFixSpeed(fanClickPos.fanRPMpercent);
                    break;
                }
                case (FANMODE.CURVE): {
                    dragPoint.current.temperature = fanClickPos.temperature;
                    dragPoint.current.fanRPMpercent = fanClickPos.fanRPMpercent;
                    selectedPoint.current = dragPoint.current;
                    setSelPointTemp(Math.trunc(selectedPoint.current.temperature));
                    setSelPointSpeed(Math.trunc(selectedPoint.current.fanRPMpercent));
                    refreshCanvas();
                    break;
                }
            }
        }
        return (window.SP_REACT.createElement("div", null,
            window.SP_REACT.createElement("style", null,
                //禁用滑动防止画布拖动事件失去焦点
                `
        .gamepaddialog_ModalPosition_30VHl{
          overflow-y:hidden
        }
        `,
                `
        .DialogLabel, .DialogLabelStrong {
          font-weight: 500;
          color: #ffffff;
          text-transform: uppercase;
          line-height: 19px;
          font-size: 16px;
          margin-bottom: 4px;
          user-select: none;
          letter-spacing: initial;
        }
      `),
            window.SP_REACT.createElement(ModalRoot, { onCancel: closeModal, onEscKeypress: closeModal },
                window.SP_REACT.createElement("h1", { style: { marginBlockEnd: "5px", marginBlockStart: "-15px", fontSize: 25 } },
                    window.SP_REACT.createElement("div", { style: { width: 180, display: "inline-block" } }, localizationManager.getString(localizeStrEnum.FAN_PROFILE_NAME)),
                    window.SP_REACT.createElement("div", { style: { width: 250, height: 20, display: "inline-block" } },
                        window.SP_REACT.createElement(TextField, { value: profileName, onChange: (e) => {
                                setProfileName(e.target.value);
                                console.log(e.target.value);
                            } }))),
                window.SP_REACT.createElement("div", { style: { marginBlockEnd: "0px", marginBlockStart: "0px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", padding: "8px 0" } },
                    window.SP_REACT.createElement(FanCanvas, { width: 300, height: 300, style: {
                            "width": "300px",
                            "height": "300px",
                            "padding": "0px",
                            "border": "1px solid #1a9fff",
                            // @ts-ignore
                            "background-color": "#1a1f2c",
                            "border-radius": "4px",
                        }, 
                        //onPointerDown={(e:any) => onPointerDown(e)}
                        //onPointerMove={(e:any) => onPointerMove(e)}
                        //onPointerUp={(e:any) => onPointerUp(e)}
                        //onPointerDown={(e:fanPosition) => {onPointerDown(e)}}
                        //onPointerMove={(e:fanPosition) => {onPointerMove(e)}}
                        //onPointerUp={(e:fanPosition) => {onPointerUp(e)}}
                        onPointerShortPress: (e) => { onPointerShortPress(e); }, onPointerLongPress: (e) => { onPointerLongPress(e); }, onPointerDragDown: (e) => { return onPointerDragDown(e); }, onPointerDraging: (e) => { onPointerDraging(e); }, initDraw: (f) => { initDraw(f); } }),
                    window.SP_REACT.createElement("div", { style: {
                            "width": "300px",
                            "height": "300px",
                            // @ts-ignore
                            "overflow-x": "hidden",
                            "overflow-y": "scroll",
                        } },
                        window.SP_REACT.createElement(PanelSection, null,
                            window.SP_REACT.createElement(SliderField, { label: localizationManager.getString(localizeStrEnum.FAN_MODE), value: fanMode, step: 1, max: 2, min: 0, notchCount: 3, notchLabels: [{
                                        notchIndex: FANMODE.NOCONTROL,
                                        label: `${localizationManager.getString(localizeStrEnum.NOT_CONTROLLED)}`,
                                        value: FANMODE.NOCONTROL,
                                    }, {
                                        notchIndex: FANMODE.FIX,
                                        label: `${localizationManager.getString(localizeStrEnum.FIXED)}`,
                                        value: FANMODE.FIX,
                                    }, {
                                        notchIndex: FANMODE.CURVE,
                                        label: `${localizationManager.getString(localizeStrEnum.CURVE)}`,
                                        value: FANMODE.CURVE,
                                    }
                                ], onChange: (value) => {
                                    setFanMode(value);
                                } }),
                            fanMode == FANMODE.FIX && window.SP_REACT.createElement(SliderField, { label: localizationManager.getString(localizeStrEnum.FAN_SPEED_PERCENT), value: fixSpeed, step: 1, max: 100, min: 0, onChange: (value) => {
                                    setFixSpeed(value);
                                } }),
                            fanMode == FANMODE.CURVE && window.SP_REACT.createElement(SliderField, { label: localizationManager.getString(localizeStrEnum.SENSOR_TEMP), value: selPointTemp, valueSuffix: "°C", showValue: true, layout: "inline", disabled: !selectedPoint.current, step: 1, max: fanPosition.tempMax, min: 0, onChange: (value) => {
                                    setSelPointTemp(value);
                                } }),
                            fanMode == FANMODE.CURVE && window.SP_REACT.createElement(SliderField, { label: localizationManager.getString(localizeStrEnum.FAN_SPEED_PERCENT), value: selPointSpeed, valueSuffix: "%", showValue: true, layout: "inline", disabled: !selectedPoint.current, step: 1, max: fanPosition.fanMax, min: 0, onChange: (value) => {
                                    setSelPointSpeed(value);
                                } })))),
                window.SP_REACT.createElement(Focusable, { style: { marginBlockEnd: "-25px", marginBlockStart: "-5px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(1, 1fr)", gridGap: "0.5rem", padding: "8px 0" } },
                    window.SP_REACT.createElement(DialogButton, { onClick: () => {
                            if (onCreateProfile()) {
                                closeModal();
                            }
                        } },
                        " ",
                        localizationManager.getString(localizeStrEnum.CREATE)),
                    window.SP_REACT.createElement(DialogButton, { onClick: () => { closeModal(); } },
                        " ",
                        localizationManager.getString(localizeStrEnum.CANCEL))))));
    }
    function FANComponent() {
        const [show, setShow] = React.useState(Settings.ensureEnable());
        const fanEnable = React.useRef(FanControl.fanIsEnable);
        const hide = (ishide) => {
            setShow(!ishide);
        };
        //listen Settings
        React.useEffect(() => {
            PluginManager.listenUpdateComponent(ComponentName.FAN_ALL, [ComponentName.FAN_ALL], (_ComponentName, updateType) => {
                switch (updateType) {
                    case (UpdateType.HIDE): {
                        hide(true);
                        break;
                    }
                    case (UpdateType.SHOW): {
                        hide(false);
                        break;
                    }
                }
            });
        }, []);
        //<FANSelectProfileComponent/>
        return (window.SP_REACT.createElement("div", null, show && fanEnable.current && window.SP_REACT.createElement(PanelSection, { title: "FAN" },
            window.SP_REACT.createElement(FANSelectProfileComponent, null),
            window.SP_REACT.createElement(FANDisplayComponent, null),
            window.SP_REACT.createElement(FANRPMComponent, null),
            window.SP_REACT.createElement(FANCreateProfileComponent, null))));
    }

    /*!
     * Copyright (C) 2022 Sefa Eyeoglu <contact@scrumplex.net> (https://scrumplex.net)
     *
     * This program is free software: you can redistribute it and/or modify
     * it under the terms of the GNU General Public License as published by
     * the Free Software Foundation, either version 3 of the License, or
     * (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU General Public License for more details.
     *
     * You should have received a copy of the GNU General Public License
     * along with this program.  If not, see <https://www.gnu.org/licenses/>.
     */
    const Content = ({}) => {
        return (window.SP_REACT.createElement("div", null,
            PluginManager.isIniting() && window.SP_REACT.createElement(PanelSectionRow, null,
                window.SP_REACT.createElement(SteamSpinner, null)),
            !PluginManager.isIniting() && window.SP_REACT.createElement("div", null,
                window.SP_REACT.createElement(SettingsComponent, null),
                window.SP_REACT.createElement(CPUComponent, null),
                window.SP_REACT.createElement(GPUComponent, null),
                window.SP_REACT.createElement(FANComponent, null))));
    };
    var index = definePlugin((serverAPI) => {
        PluginManager.register(serverAPI);
        return {
            title: window.SP_REACT.createElement("div", { className: staticClasses.Title }, "PowerControl"),
            content: window.SP_REACT.createElement(Content, null),
            icon: window.SP_REACT.createElement(FaSuperpowers, null),
            onDismount() {
                PluginManager.unregister();
            }
        };
    });

    return index;

})(SP_REACT);
