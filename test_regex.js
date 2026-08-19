const text = `
3711203000014 10-AUG PIKKI KOND/8801625960/1/01/.2 (122) 23/06/26 0 561 561 0 
3711201000217 03-AUG Kokilagadd/9878648123/1/01/1 SS-1(111) 08/06/26 -1 511 510 0 
3711203000785 10-AUG GUTTULA RA/9515526298/2/01/.5 --(62) 21/06/26 0 500 500 0 ##
3711241001814 05-AUG MEKA RAMES/9640405001/2/01/.2 SS2(27) 15/06/26 0 266 266 250 ##
3711207000696 10-AUG Kota Venka//1/01/.26 (57) 29/06/26 3098 261 3359 0
3711227000305 05-AUG MADDIBOINA/9949488281/1/01/1 (124) 14/06/26 -1 587 586 0
`;

const lines = text.split('\n');
const regex = /^(\d{13})\s+(\d{2}-[A-Za-z]{3})\s+(.+?)\s+(\S+)\s+(\d{2}\/\d{2}\/\d{2})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/;

for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(regex);
    if (match) {
        console.log("MATCH:", match[1], " | ", match[3], " | ", match[4], " | Arr:", match[6], "CMD:", match[7], "Tot:", match[8]);
        
        // Extract mobile from Name field
        const nameField = match[3];
        let name = nameField;
        let mobile = "No contact number";
        const parts = nameField.split('/');
        if (parts.length > 1) {
             name = parts[0];
             // The mobile is usually the second part if it's 10 digits
             if (parts[1].match(/^\d{10}$/)) {
                 mobile = parts[1];
             }
        }
        console.log("  -> Name:", name, "Mob:", mobile);
        
    } else {
        console.log("NO MATCH:", line);
    }
}
