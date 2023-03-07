function recursivelyTraverseMutationEffects(root, parentFiber) {
  // console.log(parentFiber.type, 123);
  if (parentFiber.subTreeFlags !== 0) {
    console.log(parentFiber.type, 111);
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  console.log(finishedWork.type, 321);
}

function commitMutationEffectsOnFiber(finishedWork, root) {
  switch (finishedWork.tag) {
    case 3:
    case 5:
    case 6: {
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    default:
      break;
  }
}

const f = {
  tag: 3,
  type: 'HostRootFiber',
  subTreeFlags: 1,
  sibling: null,
  child: {
    tag: 5,
    type: 'h1',
    subTreeFlags: 1,
    sibling: null,
    child: {
      tag: 6,
      type: 'text hello',
      child: null,
      subTreeFlags: 0,
      sibling: {
        tag: 5,
        type: 'span',
        sibling: null,
        subTreeFlags: 0,
        child: null
      }
    }
  }
};

commitMutationEffectsOnFiber(f);