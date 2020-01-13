/* termios_basic.h
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#ifndef TERMIOS_BASIC_H
#define TERMIOS_BASIC_H

#include "node_termios.h"
#include <unistd.h>
#include <stdlib.h>

// helper function
NAN_METHOD(Isatty);
NAN_METHOD(Ttyname);
NAN_METHOD(Ptsname);

// termios functions
NAN_METHOD(Tcgetattr);
NAN_METHOD(Tcsetattr);
NAN_METHOD(Tcsendbreak);
NAN_METHOD(Tcdrain);
NAN_METHOD(Tcflush);
NAN_METHOD(Tcflow);
NAN_METHOD(Cfgetispeed);
NAN_METHOD(Cfgetospeed);
NAN_METHOD(Cfsetispeed);
NAN_METHOD(Cfsetospeed);

/* missing from termios.h
// optional:
void cfmakeraw(struct termios *termios_p); // not on solaris 11?
void cfmakesane(struct termios *t);  // FreeBSD
int cfsetspeed(struct termios *termios_p, speed_t speed); // not on solaris 11?

pid_t tcgetsid(int fd);             // needs #include <sys/types.h> under FreeBSD
pid_t tcgetpgrp(int fd);            // needs #include <sys/types.h> under FreeBSD
int tcsetpgrp(int fd, pid_t pgrp);  // needs #include <sys/types.h> under FreeBSD
*/



#endif // TERMIOS_BASIC_H
