/* CCBuffer.h
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#ifndef CCBUFFER_H
#define CCBUFFER_H

#include "node_termios.h"
#include "CTermios.h"

class CCBuffer : public Nan::ObjectWrap {
friend class CTermios;
public:
    static Local<FunctionTemplate> init();
private:
    explicit CCBuffer(cc_t*, int);
    ~CCBuffer();
    static Nan::Persistent<FunctionTemplate>& tmpl();
    static Local<FunctionTemplate> ctorTemplate() { return Nan::New(tmpl()); }
    static bool IsInstance(Local<Value> v) { return ctorTemplate()->HasInstance(v); }

    static NAN_INDEX_GETTER(IndexGetter);
    static NAN_INDEX_SETTER(IndexSetter);
    static NAN_INDEX_ENUMERATOR(IndexEnumerator);
    static NAN_INDEX_DELETER(IndexDeleter);
    static NAN_INDEX_QUERY(IndexQuery);
    static NAN_GETTER(Length_Getter);

    // JS methods
    static NAN_METHOD(New);
    static NAN_METHOD(ToBuffer);

    cc_t *value_;
    unsigned int length_;
};

#endif // CCBUFFER_H
