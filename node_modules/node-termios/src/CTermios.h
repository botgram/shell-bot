/* CTermios.h
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#ifndef CTERMIOS_H
#define CTERMIOS_H

#include "node_termios.h"

class CTermios : public Nan::ObjectWrap {
public:
    static Local<FunctionTemplate> init();
    static Local<FunctionTemplate> ctorTemplate() { return Nan::New(tmpl()); }
    static bool IsInstance(Local<Value> v) { return ctorTemplate()->HasInstance(v); }
    struct termios* data() { return &value_; }
private:
    explicit CTermios(struct termios *value = 0);
    ~CTermios();
    static Nan::Persistent<FunctionTemplate>& tmpl();

    // JS methods
    static NAN_METHOD(New);
    static NAN_METHOD(ToBuffer);

    static NAN_GETTER(CC_Getter);
    static NAN_GETTER(LFlag_Getter);
    static NAN_GETTER(CFlag_Getter);
    static NAN_GETTER(OFlag_Getter);
    static NAN_GETTER(IFlag_Getter);
    static NAN_SETTER(LFlag_Setter);
    static NAN_SETTER(CFlag_Setter);
    static NAN_SETTER(OFlag_Setter);
    static NAN_SETTER(IFlag_Setter);

    // data
    struct termios value_;
    Nan::Persistent<Object> ccbuffer;
};

#endif // CTERMIOS_H
