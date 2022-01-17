(function (window, undefined) {

    window['FreetypeKit'] = window['FreetypeKit'] || {};
    var FreetypeKit = window['FreetypeKit'];

    function CFaceInfo() {
        this.units_per_EM = 0;
        this.ascender = 0;
        this.descender = 0;
        this.height = 0;
        this.face_flags = 0;
        this.num_faces = 0;
        this.num_glyphs = 0;
        this.num_charmaps = 0;
        this.style_flags = 0;
        this.face_index = 0;

        this.family_name = "";

        this.style_name = "";

        this.os2_version = 0;
        this.os2_usWeightClass = 0;
        this.os2_fsSelection = 0;
        this.os2_usWinAscent = 0;
        this.os2_usWinDescent = 0;
        this.os2_usDefaultChar = 0;
        this.os2_sTypoAscender = 0;
        this.os2_sTypoDescender = 0;
        this.os2_sTypoLineGap = 0;

        this.os2_ulUnicodeRange1 = 0;
        this.os2_ulUnicodeRange2 = 0;
        this.os2_ulUnicodeRange3 = 0;
        this.os2_ulUnicodeRange4 = 0;
        this.os2_ulCodePageRange1 = 0;
        this.os2_ulCodePageRange2 = 0;

        this.os2_nSymbolic = 0;

        this.header_yMin = 0;
        this.header_yMax = 0;

        this.monochromeSizes = [];
    }


    function CGlyphMetrics() {
        this.bbox_xMin = 0;
        this.bbox_yMin = 0;
        this.bbox_xMax = 0;
        this.bbox_yMax = 0;

        this.width = 0;
        this.height = 0;

        this.horiAdvance = 0;
        this.horiBearingX = 0;
        this.horiBearingY = 0;

        this.vertAdvance = 0;
        this.vertBearingX = 0;
        this.vertBearingY = 0;

        this.linearHoriAdvance = 0;
        this.linearVertAdvance = 0;

        this.horiUnderlinePosition = 0;
        this.glyphPath = null;
    }

    FreetypeKit.CFaceInfo = CFaceInfo;
    FreetypeKit.CGlyphMetrics = CGlyphMetrics;
    // eslint-disable-next-line no-undef
    FreetypeKit.wasmModule = Module

})(window, undefined);
