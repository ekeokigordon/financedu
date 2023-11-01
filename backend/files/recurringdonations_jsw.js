import wixPricingPlansBackend from 'wix-pricing-plans-backend';
import wixData from 'wix-data';
import wixAuth from 'wix-auth';

export async function checkPricingPlans(amount, frequency) {
    //const slug = amount.toString() + '-' + frequency.toLowerCase() + 'ly';
    try {
        const pricingPlanResult = await queryPricingPlans(amount, frequency);
        const pricingPlanExists = pricingPlanResult.exists;
        if (pricingPlanExists === true) {
            return { "id": pricingPlanResult.id };
        } else {
            const creationresult = await createPricingPlan(amount, frequency);
            return { "id": creationresult._id, "details": creationresult };
        }
    } catch (error) {
        throw new Error(error);
    }
}

export async function queryPricingPlans(amount, frequency) {
    return wixPricingPlansBackend.queryPublicPlans().eq("slug", "15-monthly").find() //wixData.query("PaidPlansList").eq("price",Number(amount)).eq("frequency", frequency).find()
        .then((result) => {
            if (result && result.items && result.items.length > 0) {
                return { "exists": true, "id": result.items[0]._id };
            } else {
                return { "exists": false }
            }
        }).catch((error) => {
            throw new Error(error)
        })
}

export async function createPricingPlan(amount, frequency) {
    const planInfo = {
        "name": '$' + amount.toString() + ' ' + frequency,
        "pricing": {
            "price": {
                "value": amount.toString(),
                "currency": "USD"
            },
            "subscription": {
                "cycleDuration": {
                    "count": 1,
                    "unit": frequency
                },
                "cycleCount": 0
            }
        },
        "public": true,
        "maxPurchasesPerBuyer": 0,
        "allowFutureStartDate": false,
        "buyerCanCancel": true,
        "slug": amount.toString() + frequency.toLowerCase()
    }
    try {
        const elevatedcreatedPriceResult = wixAuth.elevate(wixPricingPlansBackend.createPlan);
        const createdPriceResult = await elevatedcreatedPriceResult(planInfo);
        return createdPriceResult;
        // wixData.insert("PaidPlansList", { "price": Number(createdPriceResult.pricing.price.value), "frequency": createdPriceResult.pricing.subscription.cycleDuration.unit, "_id": createdPriceResult._id, "id": createdPriceResult._id })
    } catch (error) {
        throw new Error(error);
    }
}
