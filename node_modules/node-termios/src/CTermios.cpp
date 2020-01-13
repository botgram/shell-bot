/* CTermios.cpp
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#include "CTermios.h"
#include "CCBuffer.h"
#include <unistd.h>
#include <errno.h>


Local<FunctionTemplate> CTermios::init() {
    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("CTermios").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    // register methods
    Nan::SetPrototypeMethod(tpl, "toBuffer", ToBuffer);

    // register properties
    Nan::SetAccessor(
        tpl->InstanceTemplate(),
        Nan::New<String>("c_cc").ToLocalChecked(),
        CC_Getter,
        0,
        Local<Value>(),
        DEFAULT,
        static_cast<PropertyAttribute>(DontDelete | ReadOnly)
    );
    Nan::SetAccessor(
        tpl->InstanceTemplate(),
        Nan::New<String>("c_lflag").ToLocalChecked(),
        LFlag_Getter,
        LFlag_Setter,
        Local<Value>(),
        DEFAULT,
        DontDelete
    );
    Nan::SetAccessor(
      tpl->InstanceTemplate(),
      Nan::New<String>("c_cflag").ToLocalChecked(),
      CFlag_Getter,
      CFlag_Setter,
      Local<Value>(),
      DEFAULT,
      DontDelete
    );
    Nan::SetAccessor(
      tpl->InstanceTemplate(),
      Nan::New<String>("c_oflag").ToLocalChecked(),
      OFlag_Getter,
      OFlag_Setter,
      Local<Value>(),
      DEFAULT,
      DontDelete
    );
    Nan::SetAccessor(
      tpl->InstanceTemplate(),
      Nan::New<String>("c_iflag").ToLocalChecked(),
      IFlag_Getter,
      IFlag_Setter,
      Local<Value>(),
      DEFAULT,
      DontDelete
    );

    // make function template persistent
    tmpl().Reset(tpl);

    return tpl;
}


CTermios::CTermios(struct termios *value)
  : value_()
{
    if (value)
        memcpy(&value_, value, sizeof(value_));
}


CTermios::~CTermios()
{
    ccbuffer.Reset();
}


Nan::Persistent<FunctionTemplate> & CTermios::tmpl()
{
    static Nan::Persistent<FunctionTemplate> my_template;
    return my_template;
}


NAN_METHOD(CTermios::New)
{
    if (info.IsConstructCall()) {
        /*
            ctor call - `new CTermios(arg)`
            supported arguments:
                <none>          - initialize termios struct with zeros
                ctermios object - initialize termios struct from other object
                number          - initialize termios struct from fd
        */
        struct termios *old = 0;
        if (info.Length() > 1)
            return Nan::ThrowError("to many arguments");
        if (info.Length() == 1) {
            if (info[0]->IsNumber()) {
                int fd = Nan::To<int>(info[0]).FromJust();
                if (!isatty(fd)) {
                    std::string error(strerror(errno));
                    return Nan::ThrowError((std::string("fd is no tty - ") + error).c_str());
                }
                struct termios fromfd = termios();
                old = &fromfd;
                int res;
                TEMP_FAILURE_RETRY(res = tcgetattr(fd, old));
                if (res) {
                    std::string error(strerror(errno));
                    return Nan::ThrowError((std::string("tcgetattr failed - ") + error).c_str());
                }
            } else if (info[0]->IsObject() && IsInstance(info[0])) {
                old = &Nan::ObjectWrap::Unwrap<CTermios>(Nan::To<Object>(info[0]).ToLocalChecked())->value_;
            } else if (!info[0]->IsUndefined() && !info[0]->IsNull())
                return Nan::ThrowError("first argument must be CTermios or file descriptor");
        }
        CTermios *obj = new CTermios(old);

        // create CCBuffer instance for property `c_cc`
        // make the CCBuffer object persistent
        Local<Function> ctor_buf = Nan::GetFunction(CCBuffer::ctorTemplate()).ToLocalChecked();
        Local<Object> buf = Nan::NewInstance(ctor_buf).ToLocalChecked();
        CCBuffer *cbuf = Nan::ObjectWrap::Unwrap<CCBuffer>(buf);
        cbuf->value_ = obj->value_.c_cc;
        cbuf->length_ = NCCS;
        obj->ccbuffer.Reset(buf);

        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    } else {
        // silently transit `CTermios()` to `new CTermios()`
        int argc = info.Length();
        Local<v8::Value> *argv = new Local<v8::Value>[argc];
        for (int i=0; i<argc; ++i)
            argv[i] = info[i];
        Local<Function> ctor = Nan::GetFunction(ctorTemplate()).ToLocalChecked();
        Nan::MaybeLocal<Object> instance(Nan::NewInstance(ctor, argc, argv));

        // ctor call can fail with an exception
        // we have to test for an empty return value
        if (instance.IsEmpty())
            info.GetReturnValue().SetUndefined();
        else
            info.GetReturnValue().Set(instance.ToLocalChecked());
        delete [] argv;
    }
}


NAN_METHOD(CTermios::ToBuffer)
{
    CTermios* obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(
      Nan::CopyBuffer((const char *) &obj->value_, sizeof(obj->value_)).ToLocalChecked());
}


NAN_GETTER(CTermios::CC_Getter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(Nan::New(obj->ccbuffer));
}


NAN_GETTER(CTermios::LFlag_Getter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(Nan::New<Number>(obj->value_.c_lflag));
}


NAN_GETTER(CTermios::CFlag_Getter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(Nan::New<Number>(obj->value_.c_cflag));
}


NAN_GETTER(CTermios::OFlag_Getter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(Nan::New<Number>(obj->value_.c_oflag));
}


NAN_GETTER(CTermios::IFlag_Getter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    info.GetReturnValue().Set(Nan::New<Number>(obj->value_.c_iflag));
}


NAN_SETTER(CTermios::LFlag_Setter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    obj->value_.c_lflag = (tcflag_t) Nan::To<uint32_t>(value).FromJust();
}


NAN_SETTER(CTermios::CFlag_Setter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    obj->value_.c_cflag = (tcflag_t) Nan::To<uint32_t>(value).FromJust();
}


NAN_SETTER(CTermios::OFlag_Setter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    obj->value_.c_oflag = (tcflag_t) Nan::To<uint32_t>(value).FromJust();
}


NAN_SETTER(CTermios::IFlag_Setter)
{
    CTermios *obj = Nan::ObjectWrap::Unwrap<CTermios>(info.Holder());
    obj->value_.c_iflag = (tcflag_t) Nan::To<uint32_t>(value).FromJust();
}
