const EMPTY = {}

export const combine = (...sources) => (start, sink) => {
    if (start !== 0) return;
    const n = sources.length;
    if (n === 0) {
        sink(0, () => {});
        sink(1, []);
        sink(2);
        return;
    }
    let Ns = n; // start counter
    let Nd = n; // data counter
    let Ne = n; // end counter
    const vals = Array(n);
    const sourceTalkbacks = Array(n);
    const talkback = (t, d) => {
        if (t !== 2) return;
        for (let i = 0; i < n; i++) sourceTalkbacks[i](2);
    };

    sources.forEach((source, i) => {
        vals[i] = EMPTY;
        source(0, (t, d) => {
            if (t === 0) {
                sourceTalkbacks[i] = d;
                if (--Ns === 0) sink(0, talkback);
            } else if (t === 1) {
                const _Nd = !Nd ? 0 : vals[i] === EMPTY ? --Nd : Nd;
                vals[i] = d;
                if (_Nd === 0) {
                    const arr = Array(n);
                    for (let j = 0; j < n; ++j) arr[j] = vals[j];
                    sink(1, arr);
                }
            } else if (t === 2) {
                if (--Ne === 0) sink(2);
            } else {
                sink(t, d);
            }
        });
    });
};

export const concat = (...sources) => (start, sink) => {
    if (start !== 0) return;
    const n = sources.length;
    if (n === 0) {
        sink(0, () => {});
        sink(2);
        return;
    }
    let i = 0;
    let sourceTalkback;
    const talkback = (t, d) => {
        if (t === 1 || t === 2) {
            sourceTalkback(t, d);
        }
    };
    (function next() {
        if (i === n) {
            sink(2);
            return;
        }
        sources[i](0, (t, d) => {
            if (t === 0) {
                sourceTalkback = d;
                if (i === 0) sink(0, talkback);
                else sourceTalkback(1);
            } else if (t === 1) {
                sink(1, d);
            } else if (t === 2) {
                i++;
                next();
            }
        });
    })();
};


export const filter = condition => source => (start, sink) => {
    if (start !== 0) return;
    let talkback;
    source(0, (t, d) => {
        if (t === 0) {
            talkback = d;
            sink(t, d);
        } else if (t === 1) {
            if (condition(d)) sink(t, d);
            else talkback(1);
        }
        else sink(t, d);
    });
};

export const flatten = source => (start, sink) => {
    if (start !== 0) return;
    const exists = x => typeof x !== 'undefined';
    const absent = x => typeof x === 'undefined';
    const noop = () => {};
    let outerEnded = false;
    let outerTalkback;
    let innerTalkback;
    function talkback(t) {
        if (t === 1) (innerTalkback || outerTalkback || noop)(1);
        if (t === 2) {
            innerTalkback && innerTalkback(2);
            outerTalkback && outerTalkback(2);
        }
    }
    source(0, (T, D) => {
        if (T === 0) {
            outerTalkback = D;
            sink(0, talkback);
        } else if (T === 1) {
            const innerSource = D;
            if (innerTalkback) innerTalkback(2);
            innerSource(0, (t, d) => {
                if (t === 0) {
                    innerTalkback = d;
                    innerTalkback(1);
                } else if (t === 1) sink(1, d);
                else if (t === 2 && absent(d)) {
                    if (outerEnded) sink(2);
                    else {
                        innerTalkback = void 0;
                        outerTalkback(1);
                    }
                }
                else if (t === 2 && exists(d)) sink(2, d);
            });
        } else if (T === 2 && absent(D)) {
            if (!innerTalkback) sink(2);
            else outerEnded = true;
        } else if (T === 2 && exists(D)) sink(2, D);
    });
};

export const forEach = operation => source => {
    let talkback;
    source(0, (t, d) => {
        if (t === 0) talkback = d;
        if (t === 1) operation(d);
        if (t === 1 || t === 0) talkback(1);
    });
};

export const fromEvent = (node, name) => (start, sink) => {
    if (start !== 0) return;
    const handler = ev => sink(1, ev);
    sink(0, t => {
        if (t === 2) node.removeEventListener(name, handler);
    });
    node.addEventListener(name, handler);
};

export const fromIter = iter => (start, sink) => {
    if (start !== 0) return;
    const iterator =
        typeof Symbol !== 'undefined' && iter[Symbol.iterator]
            ? iter[Symbol.iterator]()
            : iter;
    let inloop = false;
    let got1 = false;
    let res;
    function loop() {
        inloop = true;
        while (got1) {
            got1 = false;
            res = iterator.next();
            if (res.done) sink(2);
            else sink(1, res.value);
        }
        inloop = false;
    }
    sink(0, t => {
        if (t === 1) {
            got1 = true;
            if (!inloop && !(res && res.done)) loop();
        }
    });
};

export  const fromObs = observable => (start, sink) => {
    if (start !== 0) return;
    let dispose;
    sink(0, t => {
        if (t === 2 && dispose) {
            dispose();
        }
    });
    dispose = observable.subscribe({
        next: x => sink(1, x),
        error: e => sink(2, e),
        complete: () => sink(2)
    });
};

export const fromPromise = promise => (start, sink) => {
    if (start !== 0) return;
    let ended = false;
    const onfulfilled = val => {
        if (ended) return;
        sink(1, val);
        sink(2);
    };
    const onrejected = err => {
        if (ended) return;
        sink(2, err);
    };
    promise.then(onfulfilled, onrejected);
    sink(0, t => {
        if (t === 2) ended = true;
    });
};

export const interval = period => (start, sink) => {
    if (start !== 0) return;
    let i = 0;
    const id = setInterval(() => {
        sink(1, i++);
    }, period);
    sink(0, t => {
        if (t === 2) clearInterval(id);
    });
};

export const map = f => source => (start, sink) => {
    if (start !== 0) return;
    source(0, (t, d) => {
        sink(t, t === 1 ? f(d) : d)
    });
};

export function merge(...sources) {
    return (start, sink) => {
        if (start !== 0) return;
        const n = sources.length;
        const sourceTalkbacks = Array(n);
        let startCount = 0;
        let endCount = 0;
        const talkback = t => {
            if (t !== 2) return;
            for (let i = 0; i < n; i++) sourceTalkbacks[i](2);
        };
        for (let i = 0; i < n; i++) {
            sources[i](0, (t, d) => {
                if (t === 0) {
                    sourceTalkbacks[i] = d;
                    if (++startCount === n) sink(0, talkback);
                } else if (t === 2) {
                    if (++endCount === n) sink(2);
                } else sink(t, d);
            });
        }
    };
}
export function pipe(...cbs) {
    let res = cbs[0];
    for (let i = 1, n = cbs.length; i < n; i++) res = cbs[i](res);
    return res;
}

export function scan(reducer, seed) {
    let hasAcc = arguments.length === 2;
    return source => (start, sink) => {
        if (start !== 0) return;
        let acc = seed;
        source(0, (t, d) => {
            if (t === 1) {
                acc = hasAcc ? reducer(acc, d) : ((hasAcc = true), d);
                sink(1, acc);
            } else sink(t, d);
        });
    };
}

export const share = source => {
    let sinks = [];
    let sourceTalkback;
    return function shared(start, sink) {
        if (start !== 0) return;
        sinks.push(sink);
        if (sinks.length === 1) {
            source(0, (t, d) => {
                if (t === 0) sourceTalkback = d;
                else for (let s of sinks.slice(0)) s(t, d);
                if (t === 2) sinks = [];
            });
        }
        sink(0, (t, d) => {
            if (t === 0) return;
            if (t === 2) {
                const i = sinks.indexOf(sink);
                if (i > -1) sinks.splice(i, 1);
                if (!sinks.length) sourceTalkback(2);
            } else {
                sourceTalkback(t, d);
            }
        });
    }
}

export const skip = max => source => (start, sink) => {
    if (start !== 0) return;
    let skipped = 0;
    let talkback;
    source(0, (t, d) => {
        if (t === 0) {
            talkback = d;
            sink(t, d);
        } else if (t === 1) {
            if (skipped < max) {
                skipped++;
                talkback(1);
            } else sink(t, d);
        } else {
            sink(t, d);
        }
    });
};
export const take = max => source => (start, sink) => {
    if (start !== 0) return;
    let taken = 0;
    let sourceTalkback;
    function talkback(t, d) {
        if (taken < max) sourceTalkback(t, d);
    }
    source(0, (t, d) => {
        if (t === 0) {
            sourceTalkback = d;
            sink(0, talkback);
        } else if (t === 1) {
            if (taken < max) {
                taken++;
                sink(t, d);
                if (taken === max) {
                    sink(2);
                    sourceTalkback(2);
                }
            }
        } else {
            sink(t, d);
        }
    });
};

export const subscribe = (listener = {}) => source => {
    if (typeof listener === "function") {
        listener = { next: listener };
    }

    let { next, error, complete } = listener;
    let talkback;

    source(0, (t, d) => {
        if (t === 0) {
            talkback = d;
        }
        if (t === 1 && next) next(d);
        if (t === 1 || t === 0) talkback(1);  // Pull
        if (t === 2 && !d && complete) complete();
        if (t === 2 && !!d && error) error( d );
    });

    const dispose = () => {
        if (talkback) talkback(2);
    }

    return dispose;
};

export const sampleCombine = pullable => listenable => (start, sink) => {
    if (start !== 0) return;
    let ltalkback;
    let ptalkback;
    let origVals = [];
    listenable(0, (lt, ld) => {
        if (lt === 0) {
            ltalkback = ld;
            pullable(0, (pt, pd) => {
                if (pt === 0) ptalkback = pd;
                if (pt === 1) sink(1, [origVals.shift(), pd]);
                if (pt === 2) {
                    ltalkback(2);
                    sink(2);
                }
            });
            sink(0, t => {
                if (t === 2) {
                    ltalkback(2);
                    ptalkback(2);
                }
            });
        }
        if (lt === 1) {
            origVals.push(ld);
            ptalkback(1);
        }
        if (lt === 2) {
            ptalkback(2);
            sink(2);
        }
    });
};