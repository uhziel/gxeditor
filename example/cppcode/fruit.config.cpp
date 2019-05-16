#include "fruit.config.h"

namespace GXShare {

Energy::Energy()
    : carbohydrates(0)
    , fat(0)
    , protein(0)
{}

void Energy::Load(TiXmlElement* node)
{
    ::Read(node, "carbohydrates", carbohydrates);
    ::Read(node, "fat", fat);
    ::Read(node, "protein", protein);
}

Fruit::Fruit()
    : name("")
    , price(1)
    , per_sale_time("")
{}

void Fruit::Load(TiXmlElement* node)
{
    ::Read(node, "energy", energy);
    ::Read(node, "name", name);
    ::Read(node, "price", price);
    ::Read(node, "per_sale_time", per_sale_time);
}

}
