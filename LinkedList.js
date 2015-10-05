(function(){
    function LinkedList() {
        this.head = null;
        this.length = 0;
    }

    LinkedList.prototype.push = function(value) {
        var node = {
            value : value,
            next : null
        }, current;

        if (!this.head) {
            this.head = node;
        } else {
            current = this.head;

            while(current.next) {
                current = current.next;
            }

            current.next = node;
        }

        this.length += 1;
    };

    LinkedList.prototype.forEach = function(func) {
        var count = 0,
            current = this.head;

        while (count < this.length) {
            func(current, count);
            current = current.next;
            count += 1;
        }
    };

    LinkedList.prototype.some = function(func) {
        var count = 0,
            current = this.head,
            truth;

        while (count < this.length && truth !== true) {
            truth = func(current, count);
            current = current.next;
            count += 1;
        }


        return !!truth;
    };

    LinkedList.prototype.get = function(pos, returnReference) {
        var current = this.head,
            count = 0;

        pos = parseInt(pos, 10);

        if (pos > -1 && pos < this.length) {
            if (pos === 0) {
                if (returnReference) {
                    return this.head;
                } else {
                    return this.head.value;
                }
            }

            while (count < this.length && count !== pos) {
                current = current.next;
                count += 1;
            }

            if (returnReference) {
                return current;
            } else {
                return current.value;
            }
        }
    };
/*
    var ll = new LinkedList();

    ll.push(1);
    ll.push(2);
    ll.push(4);

    ll.forEach(function(e){
        console.log(e);
    });

    ll.some(function(e){
        return e.value === 4;
    });

    console.log(ll.get(1));
*/
    module.exports = LinkedList;
}());