﻿$(function () {

    // 蒸留所コード一覧
    var map = new Map();
    map.set("1", "Glenfarclas");
    map.set("2", "Glenlivet");
    map.set("3", "Bowmore");
    map.set("4", "Highland Park");
    map.set("5", "Auchentoshan");
    map.set("6", "Glen Deveron (Macduff)");
    map.set("7", "Longmorn");
    map.set("8", "Tamdhu");
    map.set("9", "Glen Grant");
    map.set("10", "Bunnahabhain");
    map.set("11", "Tomatin");
    map.set("12", "Benriach");
    map.set("13", "Dalmore");
    map.set("14", "Talisker");
    map.set("15", "Glenfiddich");
    map.set("16", "Glenturret");
    map.set("17", "Scapa");
    map.set("18", "Inchgower");
    map.set("19", "Glen Garioch");
    map.set("20", "Inverleven");
    map.set("21", "Glenglassaugh");
    map.set("22", "Glenkinchie");
    map.set("23", "Bruichladdich");
    map.set("24", "Macallan");
    map.set("25", "Rosebank");
    map.set("26", "Clynelish");
    map.set("27", "Springbank");
    map.set("28", "Tullibardine");
    map.set("29", "Laphroaig");
    map.set("30", "Glenrothes");
    map.set("31", "Isle of Jura");
    map.set("32", "Edradour");
    map.set("33", "Ardbeg");
    map.set("34", "Tamnavulin");
    map.set("35", "Glen Moray");
    map.set("36", "Benrinnes");
    map.set("37", "Cragganmore");
    map.set("38", "Caperdonich");
    map.set("39", "Linkwood");
    map.set("40", "Balvenie");
    map.set("41", "Dailuaine");
    map.set("42", "Ledaig (Tobermory)");
    map.set("43", "Port Ellen");
    map.set("44", "Craigellachie");
    map.set("45", "Dallas Dhu");
    map.set("46", "Glenlossie");
    map.set("47", "Benromach");
    map.set("48", "Balmenach");
    map.set("49", "St. Magdalene");
    map.set("50", "Bladnoch");
    map.set("51", "Bushmills");
    map.set("52", "Old Pulteney");
    map.set("53", "Caol Ila");
    map.set("54", "Aberlour");
    map.set("55", "Royal Brackla");
    map.set("56", "Coleburn");
    map.set("57", "Glen Mhor");
    map.set("58", "Strathisla");
    map.set("59", "Teaninich");
    map.set("60", "Aberfeldy");
    map.set("61", "Brora");
    map.set("62", "Glenlochy");
    map.set("63", "Glentauchers");
    map.set("64", "Mannochmore");
    map.set("65", "Imperial");
    map.set("66", "Ardmore");
    map.set("67", "Banff");
    map.set("68", "Blair Athol");
    map.set("69", "Glen Albyn");
    map.set("70", "Balblair");
    map.set("71", "Glenburgie");
    map.set("72", "Miltonduff");
    map.set("73", "Aultmore");
    map.set("74", "North Port");
    map.set("75", "Glenury-Royal");
    map.set("76", "Mortlach");
    map.set("77", "Glen Ord");
    map.set("78", "Ben Nevis");
    map.set("79", "Deanston");
    map.set("80", "Glen Spey");
    map.set("81", "Glen Keith");
    map.set("82", "Glencadam");
    map.set("83", "Convalmore");
    map.set("84", "Glendullan");
    map.set("85", "Glen Elgin");
    map.set("86", "Glenesk");
    map.set("87", "Millburn");
    map.set("88", "Speyburn");
    map.set("89", "Tomintoul");
    map.set("90", "Pittyvaich");
    map.set("91", "Dufftown");
    map.set("92", "Lochside");
    map.set("93", "Glen Scotia");
    map.set("94", "Old Fettercairn");
    map.set("95", "Auchroisk (Singleton)");
    map.set("96", "Glendronach");
    map.set("97", "Littlemill");
    map.set("98", "Lomond (Inverleven)");
    map.set("99", "Glenugie");
    map.set("100", "Strathmill");
    map.set("101", "Knockando");
    map.set("102", "Dalwhinnie");
    map.set("103", "Royal Lochnagar");
    map.set("104", "Glencraig (Glenburgie)");
    map.set("105", "Tormore");
    map.set("106", "Cardhu");
    map.set("107", "Glenallachie");
    map.set("108", "Allt-a-Bhainne");
    map.set("109", "Mosstowie (Miltonduff)");
    map.set("110", "Oban");
    map.set("111", "Lagavulin");
    map.set("112", "Loch Lomond (Inchmurrin)");
    map.set("113", "Braes of Glenlivet (Braeval)");
    map.set("114", "Longrow (Springbank)");
    map.set("115", "An Cnoc (Knockdhu)");
    map.set("116", "Yoichi");
    map.set("117", "Cooley (unpeated)");
    map.set("118", "Cooley (peated)");
    map.set("119", "Yamazaki");
    map.set("120", "Hakushu");
    map.set("121", "Isle of Arran");
    map.set("122", "Croftengea (Loch Lomond)");
    map.set("123", "Glengoyne");
    map.set("124", "Miyagikyo");
    map.set("125", "Glenmorangie");
    map.set("126", "Hazelburn (Springbank)");
    map.set("127", "Port Charlotte (Bruichladdich)");
    map.set("128", "Penderyn");
    map.set("129", "Kilchoman");
    map.set("130", "Chichibu");
    map.set("131", "Hanyu");
    map.set("132", "Karuizawa");
    map.set("133", "Westland");
    map.set("134", "Paul John");
    map.set("135", "Loch Lomond Inchmoan");
    map.set("G1", "North British");
    map.set("G2", "Carsebridge");
    map.set("G3", "Caledonian");
    map.set("G4", "Cameronbridge");
    map.set("G5", "Invergordon");
    map.set("G6", "Port Dundas");
    map.set("G7", "Girvan");
    map.set("G8", "Cambus");
    map.set("G9", "Loch Lomond");
    map.set("G10", "Strathclyde");
    map.set("G11", "Nikka Coffey Grain");
    map.set("G12", "Nikka Coffey Malt");
    map.set("G13", "Chita");
    map.set("G14", "Dumbarton");
    map.set("G15", "Loch Lomond");
    map.set("B1", "Heaven Hill");
    map.set("B2", "Bernheim");
    map.set("B3", "Rock Town");
    map.set("B4", "FEW Spirits");
    map.set("B5", "Cascade Hollow");

    var regExp = new RegExp("^\\n?.*? *(.?\\d+)\\.\\d+[ 　]*");
    $("body :not(:has(*))").each(function() {
    var matched = $(this).text();
        if (matched.match(regExp)) {
            var code = matched.replace(regExp, '$1');
            var name = map.get(code);
            if (typeof name === "undefined") return;
            $(this).html(matched+"<div style='color: blue'>"+name+"</div>");
        }
    });
});
