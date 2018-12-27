#ifndef __GXShare__HEADER__
#define __GXShare__HEADER__

#include "ixmlread.h"

namespace GXShare {

struct Energy
{
    Energy();

    double carbohydrates;
    double fat;
    double protein;

    void Load(TiXmlElement* node);
};

struct Fruit
{
    Fruit();

    Energy energy;
    std::string name;
    int price;

    void Load(TiXmlElement* node);
};

}

#endif
