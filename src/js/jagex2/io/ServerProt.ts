export default class ServerProt {
    // interfaces
    static readonly IF_OPENCHATMODAL: number = 14;
    static readonly IF_OPENMAINSIDEMODAL: number = 28;
    static readonly IF_CLOSE: number = 129; // NXT has "static readonly IF_CLOSESUB"
    static readonly IF_OPENSIDEOVERLAY: number = 167;
    static readonly IF_OPENMAINMODAL: number = 168;
    static readonly IF_OPENSIDEMODAL: number = 195;

    // updating interfaces
    static readonly IF_SETCOLOUR: number = 2; // NXT naming
    static readonly IF_SETHIDE: number = 26; // NXT naming
    static readonly IF_SETOBJECT: number = 46; // NXT naming
    static readonly IF_SHOWSIDE: number = 84;
    static readonly IF_SETMODEL: number = 87; // NXT naming
    static readonly IF_SETRECOL: number = 103; // NXT naming
    static readonly IF_SETANIM: number = 146; // NXT naming
    static readonly IF_SETPLAYERHEAD: number = 197; // NXT naming
    static readonly IF_SETTEXT: number = 201; // NXT naming
    static readonly IF_SETNPCHEAD: number = 204; // NXT naming
    static readonly IF_SETPOSITION: number = 209; // NXT naming

    // tutorial area
    static readonly TUTORIAL_FLASHSIDE: number = 126;
    static readonly TUTORIAL_OPENCHAT: number = 185;

    // inventory
    static readonly UPDATE_INV_STOP_TRANSMIT: number = 15; // NXT naming
    static readonly UPDATE_INV_FULL: number = 98; // NXT naming
    static readonly UPDATE_INV_PARTIAL: number = 213; // NXT naming

    // camera control
    static readonly CAM_LOOKAT: number = 3; // NXT naming
    static readonly CAM_SHAKE: number = 13; // NXT naming
    static readonly CAM_MOVETO: number = 74; // NXT naming
    static readonly CAM_RESET: number = 239; // NXT naming

    // entity updates
    static readonly NPC_INFO: number = 1; // NXT naming
    static readonly PLAYER_INFO: number = 184; // NXT naming

    // input tracking
    static readonly FINISH_TRACKING: number = 133;
    static readonly ENABLE_TRACKING: number = 226;

    // social
    static readonly MESSAGE_GAME: number = 4; // NXT naming
    static readonly UPDATE_IGNORELIST: number = 21; // NXT naming
    static readonly CHAT_FILTER_SETTINGS: number = 32; // NXT naming
    static readonly MESSAGE_PRIVATE: number = 41; // NXT naming
    static readonly UPDATE_FRIENDLIST: number = 152; // NXT naming

    // misc
    static readonly UNSET_MAP_FLAG: number = 19; // NXT has "SET_MAP_FLAG" but we cannot control the position
    static readonly UPDATE_RUNWEIGHT: number = 22; // NXT naming
    static readonly HINT_ARROW: number = 25; // NXT naming
    static readonly UPDATE_REBOOT_TIMER: number = 43; // NXT naming
    static readonly UPDATE_STAT: number = 44; // NXT naming
    static readonly UPDATE_RUNENERGY: number = 68; // NXT naming
    static readonly RESET_ANIMS: number = 136; // NXT naming
    static readonly UPDATE_UID192: number = 139; // NXT naming (not 100% certain if "uid192" means local player)
    static readonly LAST_LOGIN_INFO: number = 140; // NXT naming
    static readonly LOGOUT: number = 142; // NXT naming
    static readonly P_COUNTDIALOG: number = 243; // named after runescript command + client resume_p_countdialog packet
    static readonly SET_MULTIWAY: number = 254;

    // maps
    static readonly DATA_LOC_DONE: number = 20;
    static readonly DATA_LAND_DONE: number = 80;
    static readonly DATA_LAND: number = 132;
    static readonly DATA_LOC: number = 220;
    static readonly REBUILD_NORMAL: number = 237; // NXT naming (do we really need _normal if there's no region rebuild?)

    // vars
    static readonly VARP_SMALL: number = 150; // NXT naming
    static readonly VARP_LARGE: number = 175; // NXT naming
    static readonly RESET_CLIENT_VARCACHE: number = 193; // NXT naming

    // audio
    static readonly SYNTH_SOUND: number = 12; // NXT naming
    static readonly MIDI_SONG: number = 54; // NXT naming
    static readonly MIDI_JINGLE: number = 212; // NXT naming

    // zones
    static readonly UPDATE_ZONE_PARTIAL_FOLLOWS: number = 7; // NXT naming
    static readonly UPDATE_ZONE_FULL_FOLLOWS: number = 135; // NXT naming
    static readonly UPDATE_ZONE_PARTIAL_ENCLOSED: number = 162; // NXT naming

    // zone protocol
    static readonly LOC_MERGE: number = 23; // based on runescript command p_locmerge
    static readonly LOC_ANIM: number = 42; // NXT naming
    static readonly OBJ_DEL: number = 49; // NXT naming
    static readonly OBJ_REVEAL: number = 50; // NXT naming
    static readonly LOC_ADD_CHANGE: number = 59; // NXT naming
    static readonly MAP_PROJANIM: number = 69; // NXT naming
    static readonly LOC_DEL: number = 76; // NXT naming
    static readonly OBJ_COUNT: number = 151; // NXT naming
    static readonly MAP_ANIM: number = 191; // NXT naming
    static readonly OBJ_ADD: number = 223; // NXT naming
}
