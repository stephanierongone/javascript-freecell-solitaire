//class to represent a game of freecell in javascript.
class FreecellGame {
    //constructs a game of freecell with the given number of open and cascade piles.
    //there are always 4 foundation piles.
    constructor(numOpen, numCascade) {
        if (numOpen <= 0 || numCascade < 4) {
            throw new Error("Invalid game inputs!");
        }
        this.foundation = [];
        for(let k = 0; k < 4; k++) {
            this.foundation.push([]);
        }
        this.open = [];
        for(let k = 0; k < numOpen; k++) {
            this.open.push([]);
        }
        var deck = getDeck();
        this.cascade = [];
        for(let k = 0; k < numCascade; k++) {
            this.cascade.push([]);
        }
        for(let i = 0; i < deck.length; i++) {
            this.cascade[i % numCascade].push(deck[i]);
        }
    }

    //return number of cascade piles
    getNumCascade() {
        return this.cascade.length;
    }
    //return number of open piles
    getNumOpen() {
        return this.open.length;
    }
    //return number of foundation piles
    getFoundation() {
        return this.foundation.map(p => p.slice());
    }
    //return number of open piles
    getOpen() {
        return this.open.map(p => p.slice());
    }
    //return number of cascade piles
    getCascade() {
        return this.cascade.map(p => p.slice());
    }

    // execute a move from srcPile, e.g. {type:"cascade", index: 0, cardIndex, 5}
    // to destPile, e.g. {type:"open", index: 3}
    // mutates the game state.
    executeMove(srcPile, destPile) {
        let srcType = Object.values(srcPile)[0];
        let srcIndex = Object.values(srcPile)[1];
        let srcCard = Object.values(srcPile)[2];
        let destType = Object.values(destPile)[0];
        let destIndex = Object.values(destPile)[1];

        switch (srcType) {
            case 'open':
                this.moveFromOpen(srcIndex, destType, destIndex);
                break;
            case 'cascade':
                this.moveFromCascade(srcIndex, srcCard, destType, destIndex);
                break;
            default:
                break;
        }

        // .pop(): remove and return last element of array
        // .push(arg): add arg to end of array
    }

    // attempt to stick the given card on either a foundation or an open
    // by finding whatever foundation pile is valid, or the first open pile.
    // return true if success, false if no automatic move available
    // mutates the game state if a move is available.
    attemptAutoMove(srcPile) {
        //will not allow the user to click on an empty pile for an automove
        if (srcPile.length === 0) {
             throw new Error("Invalid inputs.");
        }
        if (Object.values(srcPile)[0] === 'foundation') {
            throw new Error("invalid inputs.");
        }
        //if there is a valid foundation pile to add to, add to it and remove this card from the cascade pile
        if (this.getValidFoundation(srcPile) !== -1) {
            if (Object.values(srcPile)[0] === 'cascade') {// if trying to move from cascade
                this.foundation[this.getValidFoundation(srcPile)].push(this.cascade[Object.values(srcPile)[1]].pop());
            }
            else {
                this.foundation[this.getValidFoundation(srcPile)].push(this.open[Object.values(srcPile)[1]].pop());
            }
            return true;
        }
        //otherwise, if there is a valid open pile to add to, add to it and remove this card from the open pile
        if (this.getFirstAvailableOpen() !== -1) {
            if (Object.values(srcPile)[0] === 'cascade') {
                this.open[this.getFirstAvailableOpen()].push(this.cascade[Object.values(srcPile)[1]].pop());
                return true;
            }
        }
        //otherwise, there are no available auto-moves to make and the function will return false to the controller.
        return false;
    }

    // return index of first valid foundation destination for the given card,
    // or anything else if there is no valid foundation destination

    //my implementation: returns -1 if there is no valid foundation for it to go to
    getValidFoundation(srcPile) {
        if(!srcPile || srcPile.type === "foundation") {
            return false;
        }
        let card = null;
        let srcType = Object.values(srcPile)[0];
        let srcIndex = Object.values(srcPile)[1];
        let srcCard = Object.values(srcPile)[2];
        if (!(srcType === 'open' || srcType === 'cascade')) {
            throw new Error("invalid input.");
        }
        if (srcType === 'open') {
            card = this.open[srcIndex][0];
        }
        else {
            card = this.cascade[srcIndex][srcCard];
        }

        for (let i = 0; i < 4; i++) { //there are only ever 4 foundation piles in a game
            //check for any foundation piles that exist for this card's suit already
            if (this.getFoundation()[i].length > 0) { //if its not empty
                //if they're the same suit
                if (this.getFoundation()[i][0].getSuit() === card.getSuit()) {
                   //if the ranks are increasing according to the rules of solitaire
                    if (this.getFoundation()[i][this.getFoundation()[i].length - 1].getValue()
                        === card.getValue() - 1) {
                        return i;
                    }
                    //otherwise return -1 because multiple foundation piles cannot exist for the same suit.
                    return -1;
                }
            }
        }
        //if there were no existing piles for this card to be added to, look to see if there are any open ones
        for (let j = 0; j < 4; j++) {
            if (this.getFoundation()[j].length === 0 && card.getValue() === 1) {
                return j;
            }
        }
        //otherwise, there are no empty foundation piles and all others are invalid for this card to go to
        return -1;
    }


    // return index of first empty open pile
    // or anything else if no empty open pile

    //my implementation: returns -1 if there is no empty pile here
    getFirstAvailableOpen() {
        //cycle through the open piles in this game and check their length.
        //if the length is 0, it is empty and this pile's index should be returned
        for (let i = 0; i < this.getNumOpen(); i++) {
            if (this.getOpen()[i].length === 0) {
                return i;
            }
        }
        return -1;
        //otherwise return -1, there are no open piles to add to.
    }

    // return true if in the given cascade pile, starting from given index, there is a valid "build"
    isBuild(pileIdx, cardIdx) {
        //if the card index that is being moved is greater than the length of the pile, or is less than 0, throw error.
        if (cardIdx > this.getCascade()[pileIdx].length || cardIdx < 0) {
            throw new Error("Invalid card index.");
        }
        //for each card in the stack of cards, check to see that colors are alternating and ranks decreasing.
        //if either of these conditions is not met, return false as that would not be a valid build.
        for (let i = cardIdx; i < this.cascade[pileIdx].length - 1; i++) {
            let card1 = this.getCascade()[pileIdx][i];
            let card2 = this.getCascade()[pileIdx][i + 1];
            if (card1.getValue() - card2.getValue() !== 1) {
                return false;
            }
            if (!FreecellGame._isStackable(card1, card2)) {
                return false;
            }
        }
        //if none of the above conditions fail for any set of cards, return true as this is a valid build.
        return true;
    }

    // return true if the move from srcPile to destPile would be valid, false otherwise.
    // does NOT mutate the model.
    isValidMove(srcPile, destPile) {
        if(!srcPile || !destPile
            || (srcPile.type === destPile.type && srcPile.index === destPile.index)
            || srcPile.type === "foundation") {
            return false;
        }

        //read in data
        let srcType = Object.values(srcPile)[0];
        let srcIndex = Object.values(srcPile)[1];
        let srcCard = Object.values(srcPile)[2];
        let destType = Object.values(destPile)[0];
        let destIndex = Object.values(destPile)[1];

        // all the rules for moves in freecell:

        switch (srcType) {
            case 'open':
                if (this.getOpen()[srcIndex].length === 0) { //if theres nothing in the open pile, cannot move
                    return false;
                }
                return this.isValidMoveFromOpen(srcIndex, destType, destIndex);
            case 'cascade':
                //if the cascade you're taking from is empty, return false
                if (this.getCascade()[srcIndex].length === 0) {
                    return false;
                }
                //if you're taking from too far in the cascade
                if (this.getCascade()[srcIndex].length <= srcCard) {
                    return false;
                }
                return this.isValidMoveFromCascade(srcIndex, srcCard, destType, destIndex);
            default:
                break;
        }

    }

    //checks for valid moves made from the cascade pile to the destination pile, as given by the parameters
    isValidMoveFromCascade(srcIndex, srcCard, destType, destIndex) {
        switch (destType) {
            case 'open':
                //return if the open pile you're trying to move to is empty.
                return (this.getOpen()[destIndex].length === 0);
            case 'cascade':
                //check if you're moving the right amount of cards
                if (this.movingTooManyCards(srcIndex, srcCard, destIndex)) {
                    return false;
                }
                //if the cascade pile you're trying to move to is empty, this move is valid
                if (this.getCascade()[destIndex].length === 0) {
                    return true;
                }

                let destCardC = this.getCascade()[destIndex][this.getCascade()[destIndex].length - 1];
                let sourceCardCC = this.getCascade()[srcIndex][srcCard];
                //need all ranks to be descending and colors to be alternating in order for the move to be valid
                return ((destCardC.getValue() === sourceCardCC.getValue() + 1)
                    && FreecellGame._isStackable(destCardC, sourceCardCC));
            case 'foundation':
                //check to make sure they're only trying to move one card
                if (this.getCascade()[srcIndex].length - 1 !== srcCard) {
                    return false;
                }
                //check to make sure that if its an ace, that the foundation pile is empty
                if (this.getCascade()[srcIndex][srcCard].getValue() === 1) {
                    return (this.getFoundation()[destIndex].length === 0);
                }
                //if the card is not an ace
                else {
                    //the pile cannot be empty
                    if (this.getFoundation()[destIndex] === undefined) {
                        return false; //you are not trying to add an ace here.
                    }
                    //if the pile is not empty, check that the suits are the same and the rank is one higher
                    else {
                        return ((this.getCascade()[srcIndex].length - 1 === srcCard) &&
                            ((this.getCascade()[srcIndex][srcCard].getSuit()
                                    === this.getFoundation()[destIndex][0].getSuit())
                                && (this.getCascade()[srcIndex][this.getCascade()[srcIndex].length - 1].getValue()
                                    === this.getFoundation()[destIndex]
                                        [this.getFoundation()[destIndex].length - 1].getValue() + 1)));
                    }
                }
            default:
                return false;
        }
    }

    //returns whether the move is valid to perform from the given open pile, to the pile of given type and index.
    isValidMoveFromOpen(srcIndex, destType, destIndex) {
        switch (destType) {
            case 'open': //open/open -> if the open pile you want to move to is empty, this is valid
                return (this.getOpen()[destIndex].length === 0);
            case 'cascade': //open/cascade -> if the cards are stackable and the values are right, this is valid
                if (this.getCascade()[destIndex].length === 0) {
                    return true;
                }
                return ((this.getCascade()[destIndex][this.getCascade()[destIndex].length - 1].getValue()
                        === this.open[srcIndex][0].getValue() + 1)
                    && (FreecellGame._isStackable((this.getCascade()[destIndex]
                        [this.getCascade()[destIndex].length - 1]), this.getOpen()[srcIndex][0])));
            case 'foundation': //open to foundation -> if it is same suit, or an ace and its an empty foundation pile
                //first check if the destination pile is empty
                if (this.open[srcIndex][0].getValue() === 1) {
                    console.log('here');
                    return (this.getFoundation()[destIndex].length === 0);
                }
                else {
                    //if its not an ace, there cannot be anything in that foundation pile
                    if (this.getFoundation()[destIndex] === undefined) {
                        return false;
                    }
                    //otherwise, check that suits are the same
                    return (((this.getOpen()[srcIndex][0].getSuit()
                                === this.getFoundation()[destIndex][0].getSuit())
                            && (this.getFoundation()[destIndex][this.getFoundation()[destIndex].length - 1].getValue()
                                === this.getOpen()[srcIndex][0].getValue() - 1)));
                }

            default:
                return false;
        }
    }

    // is overCard stackable on top of underCard, according to solitaire red-black rules
    static _isStackable(underCard, overCard) {
        return ((!underCard.isBlack() && overCard.isBlack()) || (underCard.isBlack() && !overCard.isBlack()));
    }

    //method to move the card at the srcCard index of the srcIndex cascade pile
    //to the pile of destType type and destIndex index.
    moveFromCascade(srcIndex, srcCard, destType, destIndex) {
        switch (destType) {
            case 'open':
                this.open[destIndex].push(this.cascade[srcIndex].pop());
                break;
            case 'cascade':
                let cards = this.cascade[srcIndex].splice(srcCard);
                for (let i = 0; i < cards.length; i++) {
                    this.cascade[destIndex].push(cards[i]);
                }
                break;
            case 'foundation':
                this.foundation[destIndex].push(this.cascade[srcIndex].pop());
                break;
        }
    }

    //method to move the card at the srcIndex open pile to the pile of destType type and destIndex index.
    moveFromOpen(srcIndex, destType, destIndex) {
        switch (destType) {
            case 'open':
                this.open[destIndex].push(this.open[srcIndex].pop());
                break;
            case 'cascade':
                this.cascade[destIndex].push(this.open[srcIndex].pop());
                break;
            case 'foundation':
                this.foundation[destIndex].push(this.open[srcIndex].pop());
                break;
        }
    }

    movingTooManyCards(srcIndex, srcCard, destIndex) {
        //check how many cards they're trying to move
        let numCards = this.getCascade()[srcIndex].length - srcCard;
        //start the number of open piles at 0, then increase it every time there is an open pile with length = 0
        let numOpenPiles = 0;
        for (let i = 0; i < this.getNumOpen(); i++) {
            if (this.open[i].length === 0) {
                numOpenPiles = numOpenPiles + 1;
            }
        }
        //start the number of empty cascade piles at 0,
        // then increase it every time there is a cascade pile with length = 0
        let numOpenCascades = 0;
        for (let i = 0; i < this.getCascade().length; i++) {
            if (this.getCascade()[i].length === 0) {
                numOpenCascades = numOpenCascades + 1;
            }
        }

        //if the cascade pile you're moving to is empty, this doesn't count as an empty cascade pile.
        if (this.getCascade()[destIndex].length === 0) {
            numOpenCascades = numOpenCascades - 1;
        }
        //return if the number of cards is less than the number produced by the given formula
        return (numCards > (numOpenPiles + 1) * (Math.pow(2, numOpenCascades)));
    }
}

// generate and return a shuffled deck (array) of Cards.
function getDeck() {
    let deck = [];
    let suits = ["spades", "clubs", "diamonds", "hearts"];
    for(let v = 13; v >= 1; v--) {
        for(let s of suits) {
            deck.push(new Card(v, s));
        }
    }
    shuffle(deck);    // comment out this line to not shuffle
    return deck;
}

// shuffle an array: mutate the given array to put its values in random order
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a remaining element...
        let j = Math.floor(Math.random() * (i + 1));
        // And swap it with the current element.
        [array[i], array[j]] = [array[j], array[i]];
    }
}
