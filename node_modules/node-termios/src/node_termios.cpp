/* node_termios.cpp
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#include "node_termios.h"
#include "termios_basic.h"
#include "CTermios.h"
#include "CCBuffer.h"


void populate_symbol_maps(Local<Object> all,
                          Local<Object> iflags,
                          Local<Object> oflags,
                          Local<Object> cflags,
                          Local<Object> lflags,
                          Local<Object> cc,
                          Local<Object> jsactions,
                          Local<Object> jsflushs,
                          Local<Object> jsflows,
                          Local<Object> jsbaudrates)
{
    // no platform switches here, simply test for existance of questionable symbols

    // c_iflag
    TERMIOS_EXPORT(c_iflag, iflags, IGNBRK);
    TERMIOS_EXPORT(c_iflag, iflags, BRKINT);
    TERMIOS_EXPORT(c_iflag, iflags, IGNPAR);
    TERMIOS_EXPORT(c_iflag, iflags, PARMRK);
    TERMIOS_EXPORT(c_iflag, iflags, INPCK);
    TERMIOS_EXPORT(c_iflag, iflags, ISTRIP);
    TERMIOS_EXPORT(c_iflag, iflags, INLCR);
    TERMIOS_EXPORT(c_iflag, iflags, IGNCR);
    TERMIOS_EXPORT(c_iflag, iflags, ICRNL);
#if defined(IUCLC)
    TERMIOS_EXPORT(c_iflag, iflags, IUCLC);
#endif
    TERMIOS_EXPORT(c_iflag, iflags, IXON);
    TERMIOS_EXPORT(c_iflag, iflags, IXANY);
    TERMIOS_EXPORT(c_iflag, iflags, IXOFF);
    TERMIOS_EXPORT(c_iflag, iflags, IMAXBEL);
#if defined(IUTF8)
    TERMIOS_EXPORT(c_iflag, iflags, IUTF8);
#endif

    // c_oflag
    TERMIOS_EXPORT(c_oflag, oflags, OPOST);
#if defined(OLCUC)
    TERMIOS_EXPORT(c_oflag, oflags, OLCUC);
#endif
    TERMIOS_EXPORT(c_oflag, oflags, ONLCR);
    TERMIOS_EXPORT(c_oflag, oflags, OCRNL);
    TERMIOS_EXPORT(c_oflag, oflags, ONOCR);
    TERMIOS_EXPORT(c_oflag, oflags, ONLRET);
#if defined(OFILL)
    TERMIOS_EXPORT(c_oflag, oflags, OFILL);
#endif
#if defined(OFDEL)
    TERMIOS_EXPORT(c_oflag, oflags, OFDEL);
#endif
#if defined(NLDLY)
    TERMIOS_EXPORT(c_oflag, oflags, NLDLY);
#endif
#if defined(CRDLY)
    TERMIOS_EXPORT(c_oflag, oflags, CRDLY);
#endif
#if defined(TABDLY)
    TERMIOS_EXPORT(c_oflag, oflags, TABDLY);
#endif
#if defined(BSDLY)
    TERMIOS_EXPORT(c_oflag, oflags, BSDLY);
#endif
#if defined(VTDLY)
    TERMIOS_EXPORT(c_oflag, oflags, VTDLY);
#endif
#if defined(FFDLY)
    TERMIOS_EXPORT(c_oflag, oflags, FFDLY);
#endif
#if defined(TAB0)
    TERMIOS_EXPORT(c_oflag, oflags, TAB0);
#endif
#if defined(TAB3)
    TERMIOS_EXPORT(c_oflag, oflags, TAB3);
#endif
#if defined(ONOEOT)
    TERMIOS_EXPORT(c_oflag, oflags, ONOEOT);
#endif

    // c_cflag
#if defined(CBAUD)
    TERMIOS_EXPORT(c_cflag, cflags, CBAUD);
#endif
#if defined(CBAUDEX)
    TERMIOS_EXPORT(c_cflag, cflags, CBAUDEX);
#endif
    TERMIOS_EXPORT(c_cflag, cflags, CSIZE);
    TERMIOS_EXPORT(c_cflag, cflags, CS5);
    TERMIOS_EXPORT(c_cflag, cflags, CS6);
    TERMIOS_EXPORT(c_cflag, cflags, CS7);
    TERMIOS_EXPORT(c_cflag, cflags, CS8);
    TERMIOS_EXPORT(c_cflag, cflags, CSTOPB);
    TERMIOS_EXPORT(c_cflag, cflags, CREAD);
    TERMIOS_EXPORT(c_cflag, cflags, PARENB);
    TERMIOS_EXPORT(c_cflag, cflags, PARODD);
    TERMIOS_EXPORT(c_cflag, cflags, HUPCL);
    TERMIOS_EXPORT(c_cflag, cflags, CLOCAL);
#if defined(LOBLK)
    TERMIOS_EXPORT(c_cflag, cflags, LOBLK);
#endif
#if defined(CIBAUD)
    TERMIOS_EXPORT(c_cflag, cflags, CIBAUD);
#endif
#if defined(CMSPAR)
    TERMIOS_EXPORT(c_cflag, cflags, CMSPAR);
#endif
    TERMIOS_EXPORT(c_cflag, cflags, CRTSCTS);
#if defined(CCTS_OFLOW)
    TERMIOS_EXPORT(c_cflag, cflags, CCTS_OFLOW);
#endif
#if defined(CRTS_IFLOW)
    TERMIOS_EXPORT(c_cflag, cflags, CRTS_IFLOW);
#endif
#if defined(MDMBUF)
    TERMIOS_EXPORT(c_cflag, cflags, MDMBUF);
#endif

    // c_lflag
    TERMIOS_EXPORT(c_lflag, lflags, ISIG);
    TERMIOS_EXPORT(c_lflag, lflags, ICANON);
#if defined(XCASE)
    TERMIOS_EXPORT(c_lflag, lflags, XCASE);
#endif
    TERMIOS_EXPORT(c_lflag, lflags, ECHO);
    TERMIOS_EXPORT(c_lflag, lflags, ECHOE);
#if defined(ECHOK)
    TERMIOS_EXPORT(c_lflag, lflags, ECHOK);
#endif
    TERMIOS_EXPORT(c_lflag, lflags, ECHONL);
    TERMIOS_EXPORT(c_lflag, lflags, ECHOCTL);
    TERMIOS_EXPORT(c_lflag, lflags, ECHOPRT);
    TERMIOS_EXPORT(c_lflag, lflags, ECHOKE);
#if defined(DEFECHO)
    TERMIOS_EXPORT(c_lflag, lflags, DEFECHO);
#endif
    TERMIOS_EXPORT(c_lflag, lflags, FLUSHO);
    TERMIOS_EXPORT(c_lflag, lflags, NOFLSH);
    TERMIOS_EXPORT(c_lflag, lflags, TOSTOP);
    TERMIOS_EXPORT(c_lflag, lflags, PENDIN);
    TERMIOS_EXPORT(c_lflag, lflags, IEXTEN);
#if defined(ALTWERASE)
    TERMIOS_EXPORT(c_lflag, lflags, ALTWERASE);
#endif
#if defined(EXTPROC)
    TERMIOS_EXPORT(c_lflag, lflags, EXTPROC);
#endif
#if defined(NOKERNINFO)
    TERMIOS_EXPORT(c_lflag, lflags, NOKERNINFO);
#endif

    // c_cc
    TERMIOS_EXPORT(c_cc, cc, VDISCARD);
#if defined(VDSUSP)
    TERMIOS_EXPORT(c_cc, cc, VDSUSP);
#endif
    TERMIOS_EXPORT(c_cc, cc, VEOF);
    TERMIOS_EXPORT(c_cc, cc, VEOL);
    TERMIOS_EXPORT(c_cc, cc, VEOL2);
    TERMIOS_EXPORT(c_cc, cc, VERASE);
    TERMIOS_EXPORT(c_cc, cc, VINTR);
    TERMIOS_EXPORT(c_cc, cc, VKILL);
    TERMIOS_EXPORT(c_cc, cc, VLNEXT);
    TERMIOS_EXPORT(c_cc, cc, VMIN);
    TERMIOS_EXPORT(c_cc, cc, VQUIT);
    TERMIOS_EXPORT(c_cc, cc, VREPRINT);
    TERMIOS_EXPORT(c_cc, cc, VSTART);
#if defined(VSTATUS)
    TERMIOS_EXPORT(c_cc, cc, VSTATUS);
#endif
    TERMIOS_EXPORT(c_cc, cc, VSTOP);
    TERMIOS_EXPORT(c_cc, cc, VSUSP);
#if defined(VSWTCH)
    TERMIOS_EXPORT(c_cc, cc, VSWTCH);
#endif
    TERMIOS_EXPORT(c_cc, cc, VTIME);
    TERMIOS_EXPORT(c_cc, cc, VWERASE);

    // optional_actions for tcsetattr
    TERMIOS_EXPORT(actions, jsactions, TCSANOW);
    TERMIOS_EXPORT(actions, jsactions, TCSADRAIN);
    TERMIOS_EXPORT(actions, jsactions, TCSAFLUSH);
#if defined(TCSASOFT)
    TERMIOS_EXPORT(actions, jsactions, TCSASOFT);
#endif

    // tcflush queue_selectors
    TERMIOS_EXPORT(flushs, jsflushs, TCIFLUSH);
    TERMIOS_EXPORT(flushs, jsflushs, TCOFLUSH);
    TERMIOS_EXPORT(flushs, jsflushs, TCIOFLUSH);

    // tcflow actions
    TERMIOS_EXPORT(flows, jsflows, TCOOFF);
    TERMIOS_EXPORT(flows, jsflows, TCOON);
    TERMIOS_EXPORT(flows, jsflows, TCIOFF);
    TERMIOS_EXPORT(flows, jsflows, TCION);

    // baud rates
    TERMIOS_EXPORT(baudrates, jsbaudrates, B0);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B50);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B75);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B110);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B134);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B150);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B200);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B300);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B600);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B1200);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B1800);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B2400);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B4800);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B9600);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B19200);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B38400);
#if defined(B7200)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B7200);
#endif
#if defined(B14400)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B14400);
#endif
#if defined(B28800)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B28800);
#endif
    TERMIOS_EXPORT(baudrates, jsbaudrates, B57600);
#if defined(B76800)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B76800);
#endif
    TERMIOS_EXPORT(baudrates, jsbaudrates, B115200);
    TERMIOS_EXPORT(baudrates, jsbaudrates, B230400);
#if defined(B460800)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B460800);
#endif
#if defined(B500000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B500000);
#endif
#if defined(B576000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B576000);
#endif
#if defined(B921600)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B921600);
#endif
#if defined(B1000000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B1000000);
#endif
#if defined(B1152000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B1152000);
#endif
#if defined(B1500000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B1500000);
#endif
#if defined(B2000000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B2000000);
#endif
#if defined(B2500000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B2500000);
#endif
#if defined(B3000000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B3000000);
#endif
#if defined(B3500000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B3500000);
#endif
#if defined(B4000000)
    TERMIOS_EXPORT(baudrates, jsbaudrates, B4000000);
#endif
#if defined(EXTA)
    TERMIOS_EXPORT(baudrates, jsbaudrates, EXTA);
#endif
#if defined(EXTB)
    TERMIOS_EXPORT(baudrates, jsbaudrates, EXTB);
#endif
}


NAN_MODULE_INIT(init) {
    Nan::HandleScope scope;

    // symbols
    // The symbols are grouped together by responsibility.
    // Additonally all known symbols can be found in `ALL_SYMBOLS`.
    Local<Object> all = Nan::New<Object>();
    Local<Object> iflags = Nan::New<Object>();
    Local<Object> oflags = Nan::New<Object>();
    Local<Object> cflags = Nan::New<Object>();
    Local<Object> lflags = Nan::New<Object>();
    Local<Object> cc = Nan::New<Object>();
    Local<Object> jsactions = Nan::New<Object>();
    Local<Object> jsflushs = Nan::New<Object>();
    Local<Object> jsflows = Nan::New<Object>();
    Local<Object> jsbaudrates = Nan::New<Object>();
    populate_symbol_maps(
        all, iflags, oflags, cflags, lflags,
        cc, jsactions, jsflushs, jsflows, jsbaudrates);
    MODULE_EXPORT("ALL_SYMBOLS", all);
    MODULE_EXPORT("IFLAGS", iflags);
    MODULE_EXPORT("OFLAGS", oflags);
    MODULE_EXPORT("CFLAGS", cflags);
    MODULE_EXPORT("LFLAGS", lflags);
    MODULE_EXPORT("CC", cc);
    MODULE_EXPORT("ACTION", jsactions);
    MODULE_EXPORT("FLUSH", jsflushs);
    MODULE_EXPORT("FLOW", jsflows);
    MODULE_EXPORT("BAUD", jsbaudrates);

    // helper functions - useful functions related to ttys
    MODULE_EXPORT("isatty", Nan::GetFunction(Nan::New<FunctionTemplate>(Isatty)).ToLocalChecked());
    MODULE_EXPORT("ttyname", Nan::GetFunction(Nan::New<FunctionTemplate>(Ttyname)).ToLocalChecked());
    MODULE_EXPORT("ptsname", Nan::GetFunction(Nan::New<FunctionTemplate>(Ptsname)).ToLocalChecked());

    // termios functions
    MODULE_EXPORT("tcgetattr", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcgetattr)).ToLocalChecked());
    MODULE_EXPORT("tcsetattr", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcsetattr)).ToLocalChecked());
    MODULE_EXPORT("tcsendbreak", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcsendbreak)).ToLocalChecked());
    MODULE_EXPORT("tcdrain", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcdrain)).ToLocalChecked());
    MODULE_EXPORT("tcflush", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcflush)).ToLocalChecked());
    MODULE_EXPORT("tcflow", Nan::GetFunction(Nan::New<FunctionTemplate>(Tcflow)).ToLocalChecked());
    MODULE_EXPORT("cfgetispeed", Nan::GetFunction(Nan::New<FunctionTemplate>(Cfgetispeed)).ToLocalChecked());
    MODULE_EXPORT("cfgetospeed", Nan::GetFunction(Nan::New<FunctionTemplate>(Cfgetospeed)).ToLocalChecked());
    MODULE_EXPORT("cfsetispeed", Nan::GetFunction(Nan::New<FunctionTemplate>(Cfsetispeed)).ToLocalChecked());
    MODULE_EXPORT("cfsetospeed", Nan::GetFunction(Nan::New<FunctionTemplate>(Cfsetospeed)).ToLocalChecked());

    // objects
    // NOTE: `SomeClass::init()` must be called prior usage in JS
    //       to create the ctor function in memory.
    //       For not exported classes simply call the init method here.
    MODULE_EXPORT("CTermios", Nan::GetFunction(CTermios::init()).ToLocalChecked());
    MODULE_EXPORT("CCBuffer", Nan::GetFunction(CCBuffer::init()).ToLocalChecked());
}

NODE_MODULE(termios, init)
