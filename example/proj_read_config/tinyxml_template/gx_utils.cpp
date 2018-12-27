#include "gx_utils.h"
#include <cstdio>

GXDateTime::GXDateTime()
    : value(0)
{}

time_t str2time(const std::string& str)
{
    if (str.empty())
        return 0;

    tm timeinfo;
    sscanf(str.c_str(), "%d-%d-%d %d:%d:%d",
        timeinfo.tm_year,
        timeinfo.tm_mon,
        timeinfo.tm_mday,
        timeinfo.tm_hour,
        timeinfo.tm_min,
        timeinfo.tm_sec);
    timeinfo.tm_year -= 1900;
    timeinfo.tm_mon -= 1;
    return mktime(&timeinfo);
}

GXDateTime::GXDateTime(const std::string& _str)
{
    str = _str;
    value = str2time(str);
}

void GXDateTime::Set(const std::string& _str)
{
    str = _str;
    value = str2time(str);    
}
