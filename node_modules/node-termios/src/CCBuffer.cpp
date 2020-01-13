/* CCBuffer.cpp
 *
 * Copyright (C) 2017 Joerg Breitbart
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
#include "CCBuffer.h"


Local<FunctionTemplate> CCBuffer::init()
{
    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("CCBuffer").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    // register methods
    Nan::SetPrototypeMethod(tpl, "toBuffer", ToBuffer);

    // register properties
    Nan::SetIndexedPropertyHandler(
        tpl->InstanceTemplate(),
        IndexGetter,
        IndexSetter,
        IndexQuery,
        IndexDeleter,
        IndexEnumerator
    );
    Nan::SetAccessor(
        tpl->InstanceTemplate(),
        Nan::New<String>("length").ToLocalChecked(),
        Length_Getter,
        0,
        Local<Value>(),
        DEFAULT,
        DontDelete
    );

    // make function template persistent
    tmpl().Reset(tpl);
    return tpl;
}


CCBuffer::CCBuffer(cc_t *value, int length)
    : value_(value),
      length_(length)
{
}


CCBuffer::~CCBuffer()
{
}


Nan::Persistent<FunctionTemplate> & CCBuffer::tmpl()
{
    static Nan::Persistent<FunctionTemplate> my_template;
    return my_template;
}


NAN_INDEX_GETTER(CCBuffer::IndexGetter)
{
    CCBuffer* obj = Nan::ObjectWrap::Unwrap<CCBuffer>(info.Holder());
    if (index >= obj->length_)
        return;
    info.GetReturnValue().Set(Nan::New<Number>(obj->value_[index]));
}


NAN_INDEX_SETTER(CCBuffer::IndexSetter)
{
    CCBuffer* obj = Nan::ObjectWrap::Unwrap<CCBuffer>(info.Holder());
    if (index < obj->length_ && value->IsNumber()) {
        obj->value_[index] = (cc_t) Nan::To<uint32_t>(value).FromJust();
        info.GetReturnValue().Set(Nan::New<Number>(obj->value_[index]));
    } else
        info.GetReturnValue().SetUndefined();
}


NAN_INDEX_ENUMERATOR(CCBuffer::IndexEnumerator)
{
    CCBuffer* obj = Nan::ObjectWrap::Unwrap<CCBuffer>(info.Holder());
    Local<Array> arr(Nan::New<Array>(obj->length_));
    for (unsigned int i=0; i<obj->length_; ++i)
        Nan::Set(arr, i, Nan::New<Number>(i));
    info.GetReturnValue().Set(arr);
}

NAN_INDEX_DELETER(CCBuffer::IndexDeleter)
{
    info.GetReturnValue().Set(Nan::New<Boolean>(0));
}


NAN_INDEX_QUERY(CCBuffer::IndexQuery)
{
    // TODO
}


NAN_GETTER(CCBuffer::Length_Getter)
{
    CCBuffer *obj = Nan::ObjectWrap::Unwrap<CCBuffer>(info.Holder());
    info.GetReturnValue().Set(Nan::New<Number>(obj->length_));
}


NAN_METHOD(CCBuffer::New)
{
    if (info.IsConstructCall()) {
        CCBuffer *obj = new CCBuffer(0, 0);
        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    } else {
        int argc = info.Length();
        Local<v8::Value> *argv = new Local<v8::Value>[argc];
        for (int i=0; i<argc; ++i)
            argv[i] = info[i];
        Local<Function> ctor = Nan::GetFunction(Nan::New(tmpl())).ToLocalChecked();
        info.GetReturnValue().Set(Nan::NewInstance(ctor, argc, argv).ToLocalChecked());
        delete [] argv;
    }
}


NAN_METHOD(CCBuffer::ToBuffer)
{
    CCBuffer* obj = Nan::ObjectWrap::Unwrap<CCBuffer>(info.Holder());
    info.GetReturnValue().Set(
        Nan::CopyBuffer((const char *) obj->value_, obj->length_).ToLocalChecked());
}
