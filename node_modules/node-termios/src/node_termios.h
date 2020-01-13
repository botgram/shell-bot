/* node_termios.h
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#ifndef NODE_TERMIOS_H
#define NODE_TERMIOS_H

#include "nan.h"
#include <termios.h>

using namespace node;
using namespace v8;


// macro for symbol export
#define TERMIOS_EXPORT(o, js_obj, sym)                                        \
Nan::Set(all, Nan::New<String>(#sym).ToLocalChecked(),Nan::New<Number>(sym)); \
Nan::Set(js_obj, Nan::New<String>(#sym).ToLocalChecked(),Nan::New<Number>(sym))

// macro for module export
#define MODULE_EXPORT(name, symbol)                                           \
Nan::Set(target, Nan::New<String>(name).ToLocalChecked(), symbol)

#ifndef TEMP_FAILURE_RETRY
#define TEMP_FAILURE_RETRY(exp)            \
  ({                                       \
    int _rc;                               \
    do {                                   \
      _rc = (exp);                         \
    } while (_rc == -1 && errno == EINTR); \
    _rc;                                   \
  })
#endif

#endif // NODE_TERMIOS_H