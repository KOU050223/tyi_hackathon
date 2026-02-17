import { useEffect } from "react";

const ASCII_ART_LINES = [
    ";;>;>>>>>>>>>>>>>>>>>?????????????==???==udyXY=<(;;>;;;;;;;<<+(?TWk+/?===zWZw==l==l==l=l=l=l=l==l=l=",
    ">>>>>>>>>>?>>?????????????OZZZZZuXwwyuudVV=+<;+<;;;;><<;;;;;;>><1<(?4k.<1zWZrll=ll=llllllllllllll=ll",
    ">>>?>???????????????????=?OZW====zOwTWpV1+<>>+<;;;;;;;<+;;;;>>+>>>++<(Tfe(Wyrlllllllllllllllllllllll",
    "???????????==?==?=========zyWZl==lvjXV>>?1>>><>;;;;>;>>>1<>>;>+z>>??1+<(TWHkOllllllllllllltlllllllll",
    "??=?=?==========l=l=l=lllllXWRlllv(p3(>+z>>>+>>;;>>;>;>1>1>?+<?+z???1zO++(WH21tttttttttttttttttttttt",
    "=========l=lllll=llllllllllwfWklvjW3???v?<?>=>>>:>>;>>>1z+z???==zz1zz<lwz=<4ke(ttttttttttttttttttttt",
    "==ll=lllllllllllllllllllllttXpHZjk3z1=zI?>??O???<>??>???lzzz=====t=>..?zXzz<Xkojtttrtrrrrrttttrrrrrr",
    "lllllllllllllllttlttttttttttwWbHqD+zz=wl=+?=wz??>????====Oz~<llv><<<+-zlw0zI~^_-?zrrrrrtrrrrrrrrrrrr",
    "lllllltlltltttttttttttttttttOZHgHzO1llXl==llwkl==l==lllllzO--(<_~((+-_<?jXO>.~.-!(rrrrrrrrrrrrrrrrrr",
    "llttttttttttttttttttttrrttrrtrdgKzwtttXtllzzzuOlllltllttlOC<~_(+z<~_<?11+-_??1(W[(rrrrrrrrrrrrrrrrrr",
    "tttttttttttrrrrrrrrrrrrrrrrrZ1dgDtztttZOv>_(--_~<??11ztI<<_(+v<~((<~_?<((?<11+_?!(trrrvrvrrvrvrvrrrr",
    "ttttttrrrrrrrrrrrrrrrrrrrrrZ<zd@DtXrrtT:(Jv<<<?11llz++(((zv<~(J<_..._.. _1_~~~~_(+Owvvvvzzzzzvvvvvv",
    "trrtrrrrrrrrrrrrrrrrrrrrrv>(+ld@bOdZ>(+l<<(?<<+(--_~_~<?<~(J>_-...........j__(l><??<zrvzzzvvvvvvvrvr",
    "rrrrrrrrrrrrrrrrrrrrrOC<<~_+1jdHN?!_lv<-J<_... ..._~<?<<?!_ ....._-?1(l>:<dmyzzzvzvvvvvvvv",
    "rrrrrrrrrrrrrrrO<?!?~~~_~(+=lc?=..-<~~(>-...................................+(t>:<dmmmOwvvzzzvvvvv",
    "rrrrvvvvvvvrrOv!  (zz7!.._ <+z~~(o................................._..z<t><<..XWWHR_?7Orvrvvvv",
    "rrvvrvvrvvrv! _ .?<~.(z<_~(z>j>.-............_...........-ztO_.-....z<t><<..XHkWHRi(::~<yvvz",
    "vvrvrrvrrO:....(_.-_.. .zIzrI<_:zz?>__....__jzw>.............._zrr_....-.z>t>+<..Wg@@@HrOO++zrzzz",
    "rrrrvrvrO!.......-_....?7??!_~_..._(,_.~.~~.(vvw_.-~....~.._~..(rv<~_..~.t<rc<1((MMMM@HUwwXvvzzzz",
    "7<!(+OI<.....-<<_..........-----<?Ocj-..~..~.zvv>.~..__..~.~..~(<<~~.~.~~t>rI<z?zM###MHXzzzzzvvvv",
    ".>.................-~....(jHHH/.(<<:jt<w__.~..~(77!.~.~..~~.~.~~.~.---..~._t<rIzz=zMH#MBZZuXzzvvvvv",
    ".(_...................(v<<dHWWN-.(><:IO(l~~.~~~.~~.~.~~.~...~...~_~?<<~~.~_t>r>zz=zMMMHZZZuuuXuwvvr",
    ".(<-......._(-........(C;;zdHH@@b..<<_?rIz<~~.~_jOr<.~.~.~~.~~~_~..~~~.~.~~_t<C1cjzzBUUXZZZZXXU0vvvr",
    ".(=+_...-(+wwrrw&--..._<<zrdMH@MMpz1zz:jr+O__~~~~__~~.~.__~~~.~+c~..~~.~~~_(w<(XIdSzzzzzzzXXzvvvrrvv",
    "~_l=i(xttttrXrZ<!._--_..?wZZMMN#Mslz+<:jw(l~~.~.~~~.~~~(7+xzrO>~~~~.~~~~.(Z1dWXkdXZwvvzvvvvvrvrrrrr",
    "~~jtrrrrrtttZ<...<< ;;+z._(llOMNNNNylz+<<OCj+~~.~~.~~.~~~~~~~~~~~.~~~.~~(zC+WWWSZuZXuXzvvvrvrrrrrrrr",
    "-_(OtrrrrrttI?<....._?1z1zlzldg@MMMNyzwdmJ;:?C+_~~~~~~.~~~.~~_~~_(((J++vCidWUuZkWuZWXuuXwvvrrvvrrrrr",
    "<~~jtrttrrrrl=1-...._--JzzOzdHBBBHHg@gHRWqHm+:<?O-~~_-(((J+zvC77<<;+jJ+gQHZuuuZkXWXXHXZZuZZuXZXrrrtt",
    "_~~(trrrrrrw===dgmmHy====l==l==lll=ZWHHWyyVWHHx<:?C7C?<;+++++zlOlzOTMHqkqSZZZZXbkZXkWHkZZZZZUrtttrtt",
    "l~~~(rrrrtrZll=vH@@@Hz============lllzI(CWVyyyyWG&zyOIllOOOOOOOOOttdmqqqHZZXXWkkkHkXWWZUUUZrttrttttt",
    "z_~~~jtrrrrIllll4@@@@Hzlllllllll=ll====1~(TWXWXyyWkc~<?<1tlttlltltwHgmmHHWWXHkkkkkqqkWWwrrtttttttttt",
    "wl~~~_Orrrzl=lvkd@@@@@WOllwll=l=l=lllll=:~~_?6dmkkWW&_~~~~?tltv<<<?TWHmmmqkyWUUYUHqkqqqHkkwttOyttttl",
    "zw_~~~(rrwIl=llvWH@@@@HSlldyll=l=====l==z~~~~~(XMM#M@HmJ_~~zzl>~~~~~(HHgmgmHWZ>~~._?TWqqmmmHWXOtllll",
    "zzc~~~:Otwllllllld@H@@wyllOXwlllllllllllz~~~~:~lzUWM@@@@HHa{~(a++JJJJWmHgmgmHk:.~..~.~_THmH9Illlllll",
    "uzX-~~~?wIOll=llldH@@HOdOllvWZlllllll=ll>~:~~~~jllOWZWHH@@gl~(H@g@@gHs-?TYWHHqh_.~~.~..~_?1=llllll==",
    "0Uuw++-+llllllllld@@@#lzllllZWwllll=ll=z<~~:~~:jllllOOlZWHgr_(HBYYTC<~<1-~~~~:ZS-((--~..~..?========",
    "ttrtrwXOtOlllllldH@@H6lllllllwWylll=lll>_:~~:~~l=lllllllllOwuzI_~~_<~_~~(_~~:~~1ll=lz1_~.~.._1======",
];

export const useAsciiArt = () => {
    useEffect(() => {
        console.log(ASCII_ART_LINES.join("\n"));
    }, []);
};
