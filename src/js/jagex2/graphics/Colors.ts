export default class Colors {
    // ---- these are in rgb 24 bits
    static readonly RED: number = 0xff0000; // 16711680
    static readonly GREEN: number = 0xff00; // 65280
    static readonly BLUE: number = 0xff; // 255
    static readonly YELLOW: number = 0xffff00; // 16776960
    static readonly CYAN: number = 0xffff; // 65535
    static readonly MAGENTA: number = 0xff00ff; // 16711935
    static readonly WHITE: number = 0xffffff; // 16777215
    static readonly BLACK: number = 0x0; // 0
    static readonly LIGHTRED: number = 0xff9040; // 16748608
    static readonly DARKRED: number = 0x800000; // 8388608
    static readonly DARKBLUE: number = 0x80; // 128
    static readonly ORANGE1: number = 0xffb000; // 16756736
    static readonly ORANGE2: number = 0xff7000; // 16740352
    static readonly ORANGE3: number = 0xff3000; // 16723968
    static readonly GREEN1: number = 0xc0ff00; // 12648192
    static readonly GREEN2: number = 0x80ff00; // 8453888
    static readonly GREEN3: number = 0x40ff00; // 4259584

    // other
    static readonly PROGRESS_RED: number = 0x8c1111; // 9179409
    static readonly OPTIONS_MENU: number = 0x5d5447; // 6116423
    static readonly SCROLLBAR_TRACK: number = 0x23201b; // 2301979
    static readonly SCROLLBAR_GRIP_FOREGROUND: number = 0x4d4233; // 5063219
    static readonly SCROLLBAR_GRIP_HIGHLIGHT: number = 0x766654; // 7759444
    static readonly SCROLLBAR_GRIP_LOWLIGHT: number = 0x332d25; // 3353893
    static readonly TRADE_MESSAGE: number = 0x800080; // 8388736
    static readonly DUEL_MESSAGE: number = 0xcbb789; // 13350793

    static readonly CHAT_COLORS: Int32Array = Int32Array.of(Colors.YELLOW, Colors.RED, Colors.GREEN, Colors.CYAN, Colors.MAGENTA, Colors.WHITE);

    // ---- these are in hsl 16 bits
    // hair
    static readonly HAIR_DARK_BROWN: number = 6798;
    static readonly HAIR_WHITE: number = 107;
    static readonly HAIR_LIGHT_GREY: number = 10283;
    static readonly HAIR_DARK_GREY: number = 16;
    static readonly HAIR_APRICOT: number = 4797;
    static readonly HAIR_STRAW: number = 7744;
    static readonly HAIR_LIGHT_BROWN: number = 5799;
    static readonly HAIR_BROWN: number = 4634;
    static readonly HAIR_TURQUOISE: number = 33697;
    static readonly HAIR_GREEN: number = 22433;
    static readonly HAIR_GINGER: number = 2983;
    static readonly HAIR_MAGENTA: number = 54193;

    // body
    static readonly BODY_KHAKI: number = 8741;
    static readonly BODY_CHARCOAL: number = 12;
    static readonly BODY_CRIMSON: number = 64030;
    static readonly BODY_NAVY: number = 43162;
    static readonly BODY_STRAW: number = 7735;
    static readonly BODY_WHITE: number = 8404;
    static readonly BODY_RED: number = 1701;
    static readonly BODY_BLUE: number = 38430;
    static readonly BODY_GREEN: number = 24094;
    static readonly BODY_YELLOW: number = 10153;
    static readonly BODY_PURPLE: number = 56621;
    static readonly BODY_ORANGE: number = 4783;
    static readonly BODY_ROSE: number = 1341;
    static readonly BODY_LIME: number = 16578;
    static readonly BODY_CYAN: number = 35003;
    static readonly BODY_EMERALD: number = 25239;

    static readonly BODY_RECOLOR_KHAKI: number = 9104;
    static readonly BODY_RECOLOR_CHARCOAL: number = 10275;
    static readonly BODY_RECOLOR_CRIMSON: number = 7595;
    static readonly BODY_RECOLOR_NAVY: number = 3610;
    static readonly BODY_RECOLOR_STRAW: number = 7975;
    static readonly BODY_RECOLOR_WHITE: number = 8526;
    static readonly BODY_RECOLOR_RED: number = 918;
    static readonly BODY_RECOLOR_BLUE: number = 38802;
    static readonly BODY_RECOLOR_GREEN: number = 24466;
    static readonly BODY_RECOLOR_YELLOW: number = 10145;
    static readonly BODY_RECOLOR_PURPLE: number = 58654;
    static readonly BODY_RECOLOR_ORANGE: number = 5027;
    static readonly BODY_RECOLOR_ROSE: number = 1457;
    static readonly BODY_RECOLOR_LIME: number = 16565;
    static readonly BODY_RECOLOR_CYAN: number = 34991;
    static readonly BODY_RECOLOR_EMERALD: number = 25486;

    // feet
    static readonly FEET_BROWN: number = 4626;
    static readonly FEET_KHAKI: number = 11146;
    static readonly FEET_ASHEN: number = 6439;
    static readonly FEET_DARK: number = 12;
    static readonly FEET_TERRACOTTA: number = 4758;
    static readonly FEET_GREY: number = 10270;

    // skin
    static readonly SKIN: number = 4574;
    static readonly SKIN_DARKER: number = 4550;
    static readonly SKIN_DARKER_DARKER: number = 4537;
    static readonly SKIN_DARKER_DARKER_DARKER: number = 5681;
    static readonly SKIN_DARKER_DARKER_DARKER_DARKER: number = 5673;
    static readonly SKIN_DARKER_DARKER_DARKER_DARKER_DARKER: number = 5790;
    static readonly SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER: number = 6806;
    static readonly SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER: number = 8076;
}
