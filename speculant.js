var fs = require('fs'),
    filename = "d:/downloads/WunderFund_data.csv";
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) throw err;
        console.log('OK: ' + filename);
        //console.log(data)
        var arData=data.split("\r\n");
        //console.log(arData);
        for(var i=0; i<arData.length; i++){
            if(arData[i]=="" || arData[i]=="time,price"){
                arData.splice(i,1);
                i--;
                continue;
            }
            var cost=arData[i].split(",")[1];
            arData[i]={};
            arData[i].cost=cost;
            if(i>0)
                arData[i].delta=cost-arData[i-1].cost;
        }
        console.log(arData);

        var buyCost, lastDelta, state="buy", totalProfit=0;
        for(var i=1; i<arData.length; i++){
            if (state=="buy"){
                if (arData[i].delta>0){
                    if(lastDelta==undefined || lastDelta<0){
                        buyCost=arData[i-1].cost;
                        console.log("buy", buyCost);
                        state="sell";
                    }
                }
            } else {
                if (arData[i].delta<0) {
                    if (lastDelta>0) {
                        var profit = arData[i-1].cost - buyCost;
                        console.log("sell at i="+i, arData[i-1].cost, "profit", profit);
                        totalProfit += profit;
                        console.log("Total profit", totalProfit);
                        state="buy";
                    }
                }
            }
            if(arData[i].delta!=0){
                lastDelta=arData[i].delta;
            }
        }
    });