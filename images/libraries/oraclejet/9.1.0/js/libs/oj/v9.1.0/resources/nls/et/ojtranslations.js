define({"oj-message":{fatal:"Pöördumatu",error:"Tõrge",warning:"Hoiatus",info:"Teave",confirmation:"Kinnitus","compact-type-summary":"{0}: {1}"},"oj-converter":{summary:"Väärtus pole eeldatavas vormingus.",detail:"Sisestage eeldatavas vormingus väärtus.","plural-separator":", ",hint:{summary:"Näide: {exampleValue}",detail:"Sisestage väärtus selles vormingus: '{exampleValue}'.","detail-plural":"Sisestage väärtus nendes vormingutes: '{exampleValue}'."},optionHint:{detail:"Valiku {propertyName} jaoks aktsepteeritav väärtus on {propertyValueValid}.","detail-plural":"Valiku {propertyName} jaoks aktsepteeritavad väärtused on {propertyValueValid}."},optionTypesMismatch:{summary:"Kui valiku {propertyName} jaoks on määratud väärtus {propertyValue}, on valiku {requiredPropertyName} väärtus nõutav."},optionTypeInvalid:{summary:"Valiku {propertyName} jaoks ei esitatud eeldatavat tüüpi väärtust."},optionOutOfRange:{summary:"Valiku {propertyName} väärtus {propertyValue} on vahemikust väljas."},optionValueInvalid:{summary:"Valiku {propertyName} jaoks on määratud sobimatu väärtus {propertyValue}."},number:{decimalFormatMismatch:{summary:"Esitatud väärtus pole eeldatud arvuvormingus."},shortLongUnsupportedParse:{summary:"„short“ ja „long“ pole teisendi sõelumisel toetatud.",detail:"Muutke komponent kirjutuskaitstuks. Kirjutuskaitstud väljad ei kutsu teisendi sõelumisfunktsiooni."},currencyFormatMismatch:{summary:"Esitatud väärtus pole eeldatud valuutavormingus."},percentFormatMismatch:{summary:"Esitatud väärtus pole eeldatud protsendivormingus."},invalidNumberFormat:{summary:"Esitatud väärtus pole sobiv arv.",detail:"Sisestage sobiv arv."}},color:{invalidFormat:{summary:"Sobimatu värvivorming.",detail:"Värvivorminguvaliku määratlus ei sobi."},invalidSyntax:{summary:"Värvi määratlus ei sobi.",detail:"Sisestage CSS3-standardile vastav värviväärtus."}},datetime:{datetimeOutOfRange:{summary:"Atribuudi {propertyName} väärtus {value} on vahemikust väljas.",detail:"Sisestage väärtus vahemikus {minValue} kuni {maxValue}.",hour:"tund",minute:"minut",second:"sekund",millisec:"millisekund",month:"kuu",day:"päev",year:"aasta","month name":"kuu nimi",weekday:"nädalapäev"},dateFormatMismatch:{summary:"Esitatud väärtus pole eeldatud kuupäevavormingus."},invalidTimeZoneID:{summary:"Määratud on sobimatu ajavööndi-ID {timeZoneID}."},nonExistingTime:{summary:"Sisestatud aega pole, kuna see jääb suveajale ülemiku aega."},missingTimeZoneData:{summary:"Ajavööndi andmed puuduvad. Ajavööndi andmete laadimiseks kutsuge nõutav ojs/ojtimezonedata."},timeFormatMismatch:{summary:"Esitatud väärtus pole eeldatud kelaajavormingus."},datetimeFormatMismatch:{summary:"Esitatud väärtus pole eeldatud kuupäeva- ja kellaajavormingus."},dateToWeekdayMismatch:{summary:"Kuupäev {date} ei lange päevale {weekday}.",detail:"Sisestage kuupäevale vastav nädalapäev."},invalidISOString:{invalidRangeSummary:"Välja {propertyName} väärtus '{value} on ISO 8601 stringis {isoStr} vahemikust väljas.",summary:"Määratud {isoStr} pole sobiv ISO 8601 string.",detail:"Määrake sobiv ISO 8601 string."}}},"oj-validator":{length:{hint:{min:"Sisestage {min} või enam märki.",max:"Sisestage {max} või vähem märki.",inRange:"Sisestage {min} kuni {max} märki.",exact:"Sisestage {length} märki."},messageDetail:{tooShort:"Sisestage {min} või enam märki.",tooLong:"Sisestage kuni {max} märki."},messageSummary:{tooShort:"Sisestatud on liiga vähe märke.",tooLong:"Sisestatud on liiga palju märke."}},range:{number:{hint:{min:"Sisestage arv, mis on suurem kui {min} või sellega võrdne.",max:"Sisestage arv, mis on väiksem kui {max} või sellega võrdne.",inRange:"Sisestage arv vahemikus {min}–{max}.",exact:"Sisestage number {num}."},messageDetail:{rangeUnderflow:"Sisestage {min} või suurem arv.",rangeOverflow:"Sisestage {max} või väiksem arv.",exact:"Sisestage number {num}."},messageSummary:{rangeUnderflow:"Arv on liiga väike.",rangeOverflow:"Arv on liiga suur."}},datetime:{hint:{min:"Sisestage kuupäev ja kellaeg, mis on {min} või hilisem.",max:"Sisestage kuupäev ja kellaaeg, mis on {max} või varasem.",inRange:"Sisestage kuupäev ja kellaaeg vahemikus {min} kuni {max}."},messageDetail:{rangeUnderflow:"Sisestage kuupäev, mis on {min} või hilisem.",rangeOverflow:"Sisestage kuupäev, mis on {max} või varasem."},messageSummary:{rangeUnderflow:"Kuupäev ja kellaaeg on varasemad kui lubatud varaseim kuupäev ja kellaeg.",rangeOverflow:"Kuupäev ja kellaaeg on hilisemad kui lubatud hiliseim kuupäev ja kellaaeg."}},date:{hint:{min:"Sisestage kuupäev, mis on {min} või hilisem.",max:"Sisestage kuupäev, mis on {max} või varasem.",inRange:"Sisestage kuupäev vahemikus {min} – {max}."},messageDetail:{rangeUnderflow:"Sisestage kuupäev, mis on {min} või hilisem.",rangeOverflow:"Sisestage kuupäev, mis on {max} või varasem."},messageSummary:{rangeUnderflow:"Kuupäev on varasem kui varaseim lubatud kuupäev.",rangeOverflow:"Kuupäev on hilisem kui lubatud hiliseim kuupäev."}},time:{hint:{min:"Sisestage kellaaeg, mis on {min} või hilisem.",max:"Sisestage kellaaeg, mis on {max} või sellest varasem.",inRange:"Sisestage kellaaeg vahemikus {min} kuni {max}."},messageDetail:{rangeUnderflow:"Sisestage kellaaeg, mis on {min} või hilisem.",rangeOverflow:"Sisestage kellaaeg, mis on {max} või varasem."},messageSummary:{rangeUnderflow:"Kellaaeg on varasem kui lubatud varaseim kellaaeg.",rangeOverflow:"Kellaaeg on hilisem kui lubatud hiliseim kellaaeg."}}},restriction:{date:{messageSummary:"Kuupäeval {value} on keelatud sisestus.",messageDetail:"Valitud kuupäev poel saadaval. Proovige muud kuupäeva."}},regExp:{summary:"Vorming on vale.",detail:"Sisestage selles regulaaravaldises kirjeldatud lubatud väärtused: '{pattern}'."},required:{summary:"Väärtus on nõutav.",detail:"Sisestage väärtus."}},"oj-ojEditableValue":{loading:"Laadimine",requiredText:"Nõutav"},"oj-ojInputDate":{done:"Valmis",cancel:"Loobu",prevText:"Eelmine",nextText:"Järgmine",currentText:"Täna",weekHeader:"Näd",tooltipCalendar:"Valige kuupäev.",tooltipCalendarTime:"Valige kuupäev ja kellaaeg.",tooltipCalendarDisabled:"Kuupäeva valimine on keelatud.",tooltipCalendarTimeDisabled:"Kuupäeva ja kellaaja valimine on keelatud.",picker:"Valija",weekText:"Nädal",datePicker:"Kuupäevavalija",inputHelp:"Kalendri avamiseks vajutage üles- või allanooleklahvi.",inputHelpBoth:"Kalendri avamiseks vajutage alla- või ülesnooleklahvi ja kellaaja rippmenüü avamiseks vajutage klahvikombinatsiooni Shift + allanool või ülesnool.",dateTimeRange:{hint:{min:"",max:"",inRange:""},messageDetail:{rangeUnderflow:"",rangeOverflow:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}},dateRestriction:{hint:"",messageSummary:"",messageDetail:""}},"oj-ojInputTime":{cancelText:"Loobu",okText:"OK",currentTimeText:"Praegu",hourWheelLabel:"Tund",minuteWheelLabel:"Minut",ampmWheelLabel:"EL/PL",tooltipTime:"Valige kellaaeg.",tooltipTimeDisabled:"Kellaaja valimine on keelatud.",inputHelp:"Kellaaja rippmenüü avamiseks vajutage alla- või ülesnooleklahvi.",dateTimeRange:{hint:{min:"",max:"",inRange:""},messageDetail:{rangeUnderflow:"",rangeOverflow:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}}},"oj-inputBase":{required:{hint:"",messageSummary:"",messageDetail:""},regexp:{messageSummary:"",messageDetail:""},accessibleMaxLengthExceeded:"Suurim pikkus on ületatud {len}.",accessibleMaxLengthRemaining:"{chars} märki jäänud."},"oj-ojInputPassword":{regexp:{messageDetail:"Väärtus peab vastama mustrile: {pattern}."}},"oj-ojFilmStrip":{labelAccFilmStrip:"Kuvatakse leht {pageIndex}/{pageCount}",labelAccArrowNextPage:"Järgmise lehe kuvamiseks valige Järgmine",labelAccArrowPreviousPage:"Eelmise lehe kuvamiseks valige Eelmine",tipArrowNextPage:"Järgmine",tipArrowPreviousPage:"Eelmine"},"oj-ojDataGrid":{accessibleSortAscending:"{id} on sorditud tõusvas järjestuses",accessibleSortDescending:"{id} on sorditud laskuvas järjestuses",accessibleActionableMode:"Sisestage toimingut võimaldav režiim.",accessibleNavigationMode:"Aktiveerige navigeerimisrežiim; vajutage redigeerimis- või toimingut võimaldavad režiimi aktiveerimiseks klahvi F2.",accessibleEditableMode:"Aktiveerige redigeerimisrežiim, vajutage andmeruudustikust välja liikumiseks paoklahvi (Escape).",accessibleSummaryExact:"See on andmeruudustik, milles on {rownum} rida ja {colnum} veergu",accessibleSummaryEstimate:"See on andmeruudustik, milles on teadmata arv ridu ja veerge",accessibleSummaryExpanded:"{num} rida on praegu laiendatud",accessibleRowExpanded:"Rida on laiendatud",accessibleRowCollapsed:"Rida on ahendatud",accessibleRowSelected:"Rida {row} on valitud",accessibleColumnSelected:"Veerg {column} on valitud",accessibleStateSelected:"valitud",accessibleMultiCellSelected:"{num} lahtrit on valitud",accessibleColumnSpanContext:"{extent} lai",accessibleRowSpanContext:"{extent} kõrge",accessibleRowContext:"Rida {index}",accessibleColumnContext:"Veerg {index}",accessibleRowHeaderContext:"Reapäis {index}",accessibleColumnHeaderContext:"Veerupäis {index}",accessibleRowEndHeaderContext:"Rea lõpupäis {index}",accessibleColumnEndHeaderContext:"Veeru lõpupäis {index}",accessibleRowHeaderLabelContext:"Reapäise silt {level}",accessibleColumnHeaderLabelContext:"Veerupäise silt {level}",accessibleRowEndHeaderLabelContext:"Rea lõpupäise silt {level}",accessibleColumnEndHeaderLabelContext:"Veeru lõpupäise silt {level}",accessibleLevelContext:"Tase {level}",accessibleRangeSelectModeOn:"Valitud lahtrivahemiku lisamise režiim on aktiivne.",accessibleRangeSelectModeOff:"Valitud lahtrivahemiku lisamise režiim on väljas.",accessibleFirstRow:"Jõudsite esimese reani.",accessibleLastRow:"Jõudsite viimase reani.",accessibleFirstColumn:"Jõudsite esimese veeruni",accessibleLastColumn:"Jõudsite viimase veeruni.",accessibleSelectionAffordanceTop:"Ülemine valikupide.",accessibleSelectionAffordanceBottom:"Alumine valikupide.",msgFetchingData:"Andmete toomine...",msgNoData:"Kuvatavaid üksusi pole.",labelResize:"Muuda suurust",labelResizeWidth:"Muuda laiust",labelResizeHeight:"Muuda kõrgust",labelSortRow:"Sordi read",labelSortRowAsc:"Sordi read kasvavalt",labelSortRowDsc:"Sordi read kahanevalt",labelSortCol:"Sordi veerud",labelSortColAsc:"Sordi veerud kasvavalt",labelSortColDsc:"Sordi veerud kahanevalt",labelCut:"Lõika",labelPaste:"Kleebi",labelEnableNonContiguous:"Luba mittekülgnev valik",labelDisableNonContiguous:"Keela mittekülgnev valik",labelResizeDialogSubmit:"OK",labelResizeDialogCancel:"Loobu"},"oj-ojRowExpander":{accessibleLevelDescription:"Tase {level}",accessibleRowDescription:"Tase {level}, rida {num}/{total}",accessibleRowExpanded:"Rida on laiendatud",accessibleRowCollapsed:"Rida on ahendatud",accessibleStateExpanded:"laiendatud",accessibleStateCollapsed:"ahendatud"},"oj-ojListView":{msgFetchingData:"Andmete toomine...",msgNoData:"Kuvatavaid üksusi pole.",msgItemsAppended:"{count} üksust on lõppu lisatud.",indexerCharacters:"A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z",accessibleReorderTouchInstructionText:"Topeltpuudutage ja hoidke.  Oodake, kuni kõlab heli, ja lohistage ümberkorraldamiseks.",accessibleReorderBeforeItem:"Enne {item}",accessibleReorderAfterItem:"Pärast {item}",accessibleReorderInsideItem:"Järgmisse: {item}",accessibleNavigateSkipItems:"{numSkip} üksust jäetakse vahele",labelCut:"Lõika",labelCopy:"Kopeeri",labelPaste:"Kleebi",labelPasteBefore:"Kleebi üksuse ette",labelPasteAfter:"Kleebi üksuse järele"},"oj-_ojLabel":{tooltipHelp:"Spikker",tooltipRequired:"Nõutav"},"oj-ojLabel":{tooltipHelp:"Spikker",tooltipRequired:"Nõutav"},"oj-ojInputNumber":{required:{hint:"",messageSummary:"",messageDetail:""},numberRange:{hint:{min:"",max:"",inRange:"",exact:""},messageDetail:{rangeUnderflow:"",rangeOverflow:"",exact:""},messageSummary:{rangeUnderflow:"",rangeOverflow:""}},tooltipDecrement:"Vähenemissamm",tooltipIncrement:"Suurenemissamm"},"oj-ojTable":{accessibleColumnContext:"Veerg {index}",accessibleColumnHeaderContext:"Veerupäis {index}",accessibleRowContext:"Rida {index}",accessibleSortAscending:"{id} on sorditud tõusvas järjestuses",accessibleSortDescending:"{id} on sorditud laskuvas järjestuses",accessibleStateSelected:"valitud",labelAccSelectionAffordanceTop:"Ülemine valikupide",labelAccSelectionAffordanceBottom:"Alumine valikupide",labelEnableNonContiguousSelection:"Luba mittekülgnev valik",labelDisableNonContiguousSelection:"Keela mittekülgnev valik",labelResize:"Muuda suurust",labelResizePopupSubmit:"OK",labelResizePopupCancel:"Loobu",labelResizePopupSpinner:"Muuda veeru suurust",labelSelectRow:"Vali rida",labelEditRow:"Redigeeri rida",labelSelectAndEditRow:"Vali ja redigeeri rida",labelSelectColumn:"Valige veerg",labelSort:"Sordi",labelSortAsc:"Sordi kasvavalt",labelSortDsc:"Sordi kahanevalt",msgFetchingData:"Andmete toomine...",msgNoData:"Kuvatavaid andmeid pole.",msgInitializing:"Lähtestamine...",msgColumnResizeWidthValidation:"Laiuse väärtus peab olema täisarv.",msgScrollPolicyMaxCountSummary:"Tabeli kerimise maksimaalne ridade arv on ületatud.",msgScrollPolicyMaxCountDetail:"Laadige uuesti väiksema andmekogumiga.",msgStatusSortAscending:"{0} on sorditud tõusvas järjestuses.",msgStatusSortDescending:"{0} on sorditud laskuvas järjestuses."},"oj-ojTabs":{labelCut:"Lõika",labelPasteBefore:"Kleebi üksuse ette",labelPasteAfter:"Kleebi üksuse järele",labelRemove:"Eemalda",labelReorder:"Järjesta ümber",removeCueText:"Eemaldatav"},"oj-ojCheckboxset":{readonlyNoValue:"",required:{hint:"",messageSummary:"",messageDetail:""}},"oj-ojRadioset":{readonlyNoValue:"",required:{hint:"",messageSummary:"",messageDetail:""}},"oj-ojSelect":{required:{hint:"",messageSummary:"",messageDetail:""},searchField:"Otsinguväli",noMatchesFound:"Vasteid ei leitud",oneMatchesFound:"Leiti üks vaste",moreMatchesFound:"Leiti {num} vastet",filterFurther:"Saadaval on veel tulemeid. Filtreerige täpsemalt."},"oj-ojSwitch":{SwitchON:"Sees",SwitchOFF:"Väljas"},"oj-ojCombobox":{required:{hint:"",messageSummary:"",messageDetail:""},noMatchesFound:"Vasteid ei leitud",oneMatchesFound:"Leiti üks vaste",moreMatchesFound:"Leiti {num} vastet",filterFurther:"Saadaval on veel tulemeid. Filtreerige täpsemalt."},"oj-ojSelectSingle":{required:{hint:"",messageSummary:"",messageDetail:""},noMatchesFound:"Vasteid ei leitud",oneMatchFound:"Leiti üks vaste",multipleMatchesFound:"Leiti {num} vastet",nOrMoreMatchesFound:"Leiti {num} või mitu vastet",cancel:"Loobu",labelAccOpenDropdown:"laienda",labelAccClearValue:"kustuta väärtus",noResultsLine1:"Tulemeid ei leitud",noResultsLine2:"Teie otsingule vastavat sisu ei leita."},"oj-ojInputSearch":{required:{hint:"",messageSummary:"",messageDetail:""},noMatchesFound:"Vasteid ei leitud",oneMatchesFound:"Leiti üks vaste",moreMatchesFound:"Leiti {num} vastet"},"oj-ojTree":{stateLoading:"Laadimine...",labelNewNode:"Uus sõlm",labelMultiSelection:"Mitu valikut",labelEdit:"Redigeeri",labelCreate:"Loo",labelCut:"Lõika",labelCopy:"Kopeeri",labelPaste:"Kleebi",labelPasteAfter:"Kleebi üksuse järele",labelPasteBefore:"Kleebi üksuse ette",labelRemove:"Eemalda",labelRename:"Nimeta ümber",labelNoData:"Andmeid pole"},"oj-ojPagingControl":{labelAccPaging:"Lehekülgjaotus",labelAccPageNumber:"{pageNum}. lehe sisu on laaditud",labelAccNavFirstPage:"Esimene leht",labelAccNavLastPage:"Viimane leht",labelAccNavNextPage:"Järgmine leht",labelAccNavPreviousPage:"Eelmine leht",labelAccNavPage:"Leht",labelLoadMore:"Kuva rohkem...",labelLoadMoreMaxRows:"Ridade suurim lubatud arv ({maxRows}) on täis",labelNavInputPage:"Leht",labelNavInputPageMax:"{pageMax}-st",fullMsgItemRange:"{pageFrom}–{pageTo} {pageMax} üksusest",fullMsgItemRangeAtLeast:"{pageFrom}–{pageTo} vähemalt {pageMax}.üksusest",fullMsgItemRangeApprox:"{pageFrom}–{pageTo} ligikaudu {pageMax}. üksusest",msgItemRangeNoTotal:"{pageFrom}–{pageTo} üksust",fullMsgItem:"{pageTo}/{pageMax} üksust",fullMsgItemAtLeast:"{pageTo} vähemalt {pageMax}. üksusest",fullMsgItemApprox:"{pageTo} ligikaudu {pageMax}. üksusest",msgItemNoTotal:"{pageTo} üksust",msgItemRangeCurrent:"{pageFrom}–{pageTo}",msgItemRangeCurrentSingle:"{pageFrom}",msgItemRangeOf:"/",msgItemRangeOfAtLeast:"koguarvust, mis on vähemalt",msgItemRangeOfApprox:"koguarvust, mis on ligikaudu",msgItemRangeItems:"üksust",tipNavInputPage:"Ava leht",tipNavPageLink:"Ava leht {pageNum}",tipNavNextPage:"Järgmine",tipNavPreviousPage:"Eelmine",tipNavFirstPage:"Esimene",tipNavLastPage:"Viimane",pageInvalid:{summary:"Sisestatud leheväärtus ei sobi.",detail:"Sisestage väärtus, mis on suurem kui 0."},maxPageLinksInvalid:{summary:"Valiku maxPageLinks väärtus ei sobi.",detail:"Sisestage väärtus, mis on suurem kui 4."}},"oj-ojMasonryLayout":{labelCut:"Lõika",labelPasteBefore:"Kleebi üksuse ette",labelPasteAfter:"Kleebi üksuse järele"},"oj-panel":{labelAccButtonExpand:"Laienda",labelAccButtonCollapse:"Ahenda",labelAccButtonRemove:"Eemalda",labelAccFlipForward:"Pööra edasi",labelAccFlipBack:"Pööra tagasi",tipDragToReorder:"Lohista ümberkorraldamiseks",labelAccDragToReorder:"Lohista ümberkorraldamiseks, saadaval on kontekstimenüü"},"oj-ojChart":{labelDefaultGroupName:"Rühm {0}",labelSeries:"Sari",labelGroup:"Rühm",labelDate:"Kuupäev",labelValue:"Väärtus",labelTargetValue:"Siht",labelX:"X",labelY:"Y",labelZ:"Z",labelPercentage:"Protsent",labelLow:"Madal",labelHigh:"Kõrge",labelOpen:"Ava",labelClose:"Sule",labelVolume:"Maht",labelQ1:"Q1",labelQ2:"Q2",labelQ3:"Q3",labelMin:"Miinimum",labelMax:"Maksimum",labelOther:"Muu",tooltipPan:"Panoraami",tooltipSelect:"Valikuraam",tooltipZoom:"Suumimisraam",componentName:"Diagramm"},"oj-dvtBaseGauge":{componentName:"Mõõdik"},"oj-ojDiagram":{promotedLink:"{0} link",promotedLinks:"{0} linki",promotedLinkAriaDesc:"Kaudne",componentName:"Diagramm"},"oj-ojGantt":{componentName:"Gantt",accessibleDurationDays:"{0} päeva",accessibleDurationHours:"{0} tundi",accessibleTaskInfo:"Alguskellaaeg on {0}, lõppkellaaeg on {1}, kestus on {2}",accessibleMilestoneInfo:"Kellaaeg on {0}",accessibleRowInfo:"Rida {0}",accessibleTaskTypeMilestone:"Vahekokkuvõte",accessibleTaskTypeSummary:"Kokkuvõte",accessiblePredecessorInfo:"{0} eeltoimingut",accessibleSuccessorInfo:"{0} järeltoimingut",accessibleDependencyInfo:"Sõltuvuse tüüp {0}, ühendab {1} – {2}",startStartDependencyAriaDesc:"algus – algus",startFinishDependencyAriaDesc:"algus – lõpp",finishStartDependencyAriaDesc:"lõpp – algus",finishFinishDependencyAriaDesc:"lõpp – lõpp",tooltipZoomIn:"Suurenda",tooltipZoomOut:"Vähenda",labelLevel:"Tase",labelRow:"Rida",labelStart:"Algus",labelEnd:"Lõpp",labelDate:"Kuupäev",labelBaselineStart:"Lähteplaani algus",labelBaselineEnd:"Lähteplaani lõpp",labelBaselineDate:"Lähteplaani kuupäev",labelLabel:"Silt",labelProgress:"Edenemine",labelMoveBy:"Teisaldusalus",labelResizeBy:"Suuruse muutmise alus:",taskMoveInitiated:"Tööülesande teisaldamine on alanud",taskResizeEndInitiated:"Suuruse muutmise lõpetamise ülesanne on käivitatud",taskResizeStartInitiated:"Suuruse muutmise käivitamise ülesanne on käivitatud",taskMoveSelectionInfo:"{0} muud on valitud",taskResizeSelectionInfo:"{0} muud on valitud",taskMoveInitiatedInstruction:"Kasutage teisaldamiseks nooleklahve",taskResizeInitiatedInstruction:"Kasutage suuruse muutmiseks nooleklahve",taskMoveFinalized:"Ülesande teisaldamine on lõpule jõudnud",taskResizeFinalized:"Suuruse muutmise ülesanne on lõpule viidud",taskMoveCancelled:"Ülesande teisaldamine on tühistatud",taskResizeCancelled:"Suuruse muutmise ülesanne on tühistatud",taskResizeStartHandle:"Suuruse muutmise ülesande käivitamispide",taskResizeEndHandle:"Suuruse muutmise lõpetamispide"},"oj-ojLegend":{componentName:"Legend",tooltipExpand:"Laienda",tooltipCollapse:"Ahenda"},"oj-ojNBox":{highlightedCount:"{0}/{1}",labelOther:"Muu",labelGroup:"Rühm",labelSize:"Suurus",labelAdditionalData:"Täiendavad andmed",componentName:"{0} väli"},"oj-ojPictoChart":{componentName:"Piltdiagramm"},"oj-ojSparkChart":{componentName:"Diagramm"},"oj-ojSunburst":{labelColor:"Värv",labelSize:"Suurus",tooltipExpand:"Laienda",tooltipCollapse:"Ahenda",componentName:"Sunburst"},"oj-ojTagCloud":{componentName:"Sildipilv"},"oj-ojThematicMap":{componentName:"Temaatiline kaart",areasRegion:"Alad",linksRegion:"Lingid",markersRegion:"Markerid"},"oj-ojTimeAxis":{componentName:"Ajatelg"},"oj-ojTimeline":{componentName:"Ajajoon",accessibleItemDesc:"Kirjeldus on {0}.",accessibleItemEnd:"Lõppkellaaeg on {0}.",accessibleItemStart:"Alguskellaaeg on {0}.",accessibleItemTitle:"Pealkiri on {0}.",labelSeries:"Sari",tooltipZoomIn:"Suurenda",tooltipZoomOut:"Vähenda",labelStart:"Algus",labelEnd:"Lõpp",labelDate:"Kuupäev",labelTitle:"Pealkiri",labelDescription:"Kirjeldus"},"oj-ojTreemap":{labelColor:"Värv",labelSize:"Suurus",tooltipIsolate:"Isoleeri",tooltipRestore:"Taasta",componentName:"Puukaart"},"oj-dvtBaseComponent":{labelScalingSuffixThousand:"K",labelScalingSuffixMillion:"M",labelScalingSuffixBillion:"B",labelScalingSuffixTrillion:"T",labelScalingSuffixQuadrillion:"Q",labelInvalidData:"Andmed ei sobi",labelNoData:"Kuvatavaid andmeid pole",labelClearSelection:"Tühjenda valik",labelDataVisualization:"Andmete visualiseerimine",stateSelected:"Valitud",stateUnselected:"Valimata",stateMaximized:"Maksimeeritud",stateMinimized:"Minimeeritud",stateExpanded:"Laiendatud",stateCollapsed:"Ahendatud",stateIsolated:"Isoleeritud",stateHidden:"Peidetud",stateVisible:"Nähtav",stateDrillable:"Süvitsiminekuks sobiv",labelAndValue:"{0}: {1}",labelCountWithTotal:"{0}/{1}"},"oj-ojNavigationList":{defaultRootLabel:"Navigeerimisloend",hierMenuBtnLabel:"Hierarhilise menüü nupp",selectedLabel:"valitud",previousIcon:"Eelmine",msgFetchingData:"Andmete toomine...",msgNoData:"Kuvatavaid üksusi pole.",overflowItemLabel:"Rohkem",accessibleReorderTouchInstructionText:"Topeltpuudutage ja hoidke.  Oodake, kuni kõlab heli, ja lohistage ümberkorraldamiseks.",accessibleReorderBeforeItem:"Enne {item}",accessibleReorderAfterItem:"Pärast {item}",labelCut:"Lõika",labelPasteBefore:"Kleebi üksuse ette",labelPasteAfter:"Kleebi üksuse järele",labelRemove:"Eemalda",removeCueText:"Eemaldatav"},"oj-ojSlider":{noValue:"Atribuudil ojSlider puudub väärtus",maxMin:"Maksimumväärtus ei tohi olla väiksem kui miinimum või sellega võrdne",startEnd:"value.start ei tohi olla suurem kui value.end",valueRange:"Väärtus peab jääma miinimum- ja maksimumväärtuse vahele",optionNum:"Valik {option} pole number",invalidStep:"Sobimatu etapp; etapp peab olema > 0"},"oj-ojDialog":{labelCloseIcon:"Sule"},"oj-ojPopup":{ariaLiveRegionInitialFocusFirstFocusable:"Hüpikaknasse sisenemine. Hüpikakna ja seostatud juhtelemendi vahel liikumiseks vajutage klahvi F6.",ariaLiveRegionInitialFocusNone:"Hüpikaken on avatud. Hüpikakna ja seostatud juhtelemendi vahel liikumiseks vajutage klahvi F6.",ariaLiveRegionInitialFocusFirstFocusableTouch:"Hüpikaknasse sisenemine. Hüpikakna saab sulgeda, kui liikuda hüpikaknas viimase lingini.",ariaLiveRegionInitialFocusNoneTouch:"Hüpikaken on avatud. Liikuge järgmise lingini, et määrata hüpikakna fookus.",ariaFocusSkipLink:"Avatud hüpikaknasse liikumiseks topeltpuudutage.",ariaCloseSkipLink:"Avatud hüpikakna sulgemiseks topeltpuudutage."},"oj-ojRefresher":{ariaRefreshLink:"Sisu värskendamiseks aktiveerige link",ariaRefreshingLink:"Sisu värskendamine",ariaRefreshCompleteLink:"Värskendamine on lõpule jõudnud"},"oj-ojSwipeActions":{ariaShowStartActionsDescription:"Kuva alustustoimingud",ariaShowEndActionsDescription:"Kuva lõputoimingud",ariaHideActionsDescription:"Peida toimingud"},"oj-ojIndexer":{indexerCharacters:"A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z",indexerOthers:"#",ariaDisabledLabel:"Vastavat rühmapäist ei leitud",ariaOthersLabel:"number",ariaInBetweenText:"Vahemikus {first}–{second}",ariaKeyboardInstructionText:"Väärtuse valimiseks vajutage sisestusklahvi.",ariaTouchInstructionText:"Topeltpuudutage ja hoidke žestirežiimi aktiveerimisekst ning seejärel lohistage väärtuse kohandamiseks üles või alla."},"oj-ojMenu":{labelCancel:"Loobu",ariaFocusSkipLink:"Fookus on menüül, topeltpuudutage või nipsake fookuse liigutamiseks esimesele menüükäsule."},"oj-ojColorSpectrum":{labelHue:"Toon",labelOpacity:"Läbipaistmatus",labelSatLum:"Küllastus/heledus",labelThumbDesc:"Värvispektri neljasuunaline liugur."},"oj-ojColorPalette":{labelNone:"Pole"},"oj-ojColorPicker":{labelSwatches:"Värvipalett",labelCustomColors:"Kohandatud värvid",labelPrevColor:"Eelmine värv",labelDefColor:"Vaikevärv",labelDelete:"Kustuta",labelDeleteQ:"Kas soovite kustutada?",labelAdd:"Lisa",labelAddColor:"Lisa värv",labelMenuHex:"HEX",labelMenuRgba:"RGBa",labelMenuHsla:"HSLa",labelSliderHue:"Toon",labelSliderSaturation:"Küllastus",labelSliderSat:"Küllastus",labelSliderLightness:"Heledus",labelSliderLum:"Kirkus",labelSliderAlpha:"Alfa",labelOpacity:"Läbipaistmatus",labelSliderRed:"Punane",labelSliderGreen:"Roheline",labelSliderBlue:"Sinine"},"oj-ojFilePicker":{dropzoneText:"Lohistage failid siia või klõpsake üleslaadimiseks",singleFileUploadError:"Üles saate korraga laadida ühe faili.",singleFileTypeUploadError:"Te ei saa üles laadida faile tüübiga {fileType}.",multipleFileTypeUploadError:"Te ei saa üles laadida faile tüübiga {fileTypes}.",dropzonePrimaryText:"Pukseeri",secondaryDropzoneText:"Valige fail või pukseerige see siia.",secondaryDropzoneTextMultiple:"Valige failid või pukseerige need siia.",unknownFileType:"tundmatu"},"oj-ojProgressbar":{ariaIndeterminateProgressText:"Pooleli"},"oj-ojMessage":{labelCloseIcon:"Sule",categories:{error:"Tõrge",warning:"Hoiatus",info:"Teave",confirmation:"Kinnitus"}},"oj-ojSelector":{checkboxAriaLabel:"Märkeruudu valimine {rowKey}"},"oj-ojMessages":{labelLandmark:"Teated",ariaLiveRegion:{navigationFromKeyboard:"Sõnumite alasse liikumine. Eelmisele fookuses olnud elemendile tagasiliikumiseks vajutage klahvi F6.",navigationToTouch:"Sõnumite alal on uusi sõnumeid. Sõnumite tähiseni liikumiseks kasutage VoiceOveri pöördvalitsat.",navigationToKeyboard:"Sõnumite alal on uusi sõnumeid.  Viimatise sõnumi alale liikumiseks vajutage klahvi F6.",newMessage:"Sõnumi kategooria {category}. {summary}. {detail}."}}});