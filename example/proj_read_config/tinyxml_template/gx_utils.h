#ifndef __GX_UTILS_HEADER__
#define __GX_UTILS_HEADER__

#include "tinyxml/tinyxml.h"
#include <string>
#include <vector>
#include <ctime>

struct GXDateTime
{
    GXDateTime();
    GXDateTime(const std::string& _str);
    void Set(const std::string& _str);

    std::string str;
    time_t value;
};

inline void Read(TiXmlElement* node, const char* name, int& value)
{
    const char* str = node->Attribute(name);
    if (NULL == str)
    {
        return;
    }

    value = atoi(str);
}

inline void Read(TiXmlElement* node, const char* name, std::string& value)
{
    const char* str = node->Attribute(name);
    if (NULL == str)
    {
        return;
    }

    value = str;
}

inline void Read(TiXmlElement* node, const char* name, double& value)
{
    const char* str = node->Attribute(name);
    if (NULL == str)
    {
        return;
    }

    value = atof(str);
}

inline void Read(TiXmlElement* node, const char* name, GXDateTime& value)
{
    const char* str = node->Attribute(name);
    if (NULL == str)
    {
        return;
    }

    value.Set(str);
}

template <typename T>
inline void Read(TiXmlElement* node, const char* name, T& value)
{
    TiXmlElement* child_node = node->FirstChildElement(name);
    if (NULL == child_node)
    {
        return;
    }
    value.Load(child_node);
}

template <typename T>
inline void Read(TiXmlElement* node, const char* name, std::vector<T>& value)
{
	for (TiXmlElement* child_node = node->FirstChildElement(name);
        NULL != child_node; child_node = child_node->NextSiblingElement(name))
	{
        T t;
        t.Load(child_node);
        value.push_back(t);
	}
}

#endif
