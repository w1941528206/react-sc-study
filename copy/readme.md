- createRoot
  - createFiberRoot
    - createRootImpl(#div root, options)
      - createRoot ReactDOMRoot.js
        - createContainer
          - createFiberRoot
            - root = new FiberRootNode()
              - FiberRootNode 就是为了创建根节点 里面有 containerInfo 容器信息
              - 后面根 fiber 的dom节点 就指向 FiberRootNode
            - const uninitializedFiber = createHostRootFiber() 未初始化的fiber
              - createFiber
                - new FiberNode() react-reconciler/src/ReactFiber.js
            - root.current = uninitializedFiber
            - uninitializedFiber.stateNode = root
            - initializeUpdateQueue(uninitializedFiber) 初始化更新队列
            - return root
      - const rootContainerElement = container #div root
      - listenToAllSupportedEvents(rootContainerElement) 事件代理
      - return new ReactDOMRoot(root)
        - this._internalRoot = internalRoot;

- ReactDOMRoot
- ReactDOMRoot.prototype.render = function (children)
  - updateContainer(children, root, null, null);
    - const update = createUpdate(eventTime, lane)
    - update.payload = { element }
    - const root = enqueueUpdate(current, update, lane)
      - return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane)
        - enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane)
        - return getRootForUpdatedFiber(fiber) root
    - scheduleUpdateOnFiber
      - markRootUpdated(root, lane, eventTime)
      - ensureRootIsScheduled(root, eventTime)
        - scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root))
    - entangleTransitions



- renderRootConcurrent
- workLoopConcurrent
  - workInProgress !== null && !shouldYield()
  - performUnitOfWork(workInProgress)
  - 中断的最小工作单元就是performUnitOfWork

export const shouldYield = Scheduler.unstable_shouldYield
export shouldYieldToHost as unstable_shouldYield scheduler/src/forks/Scheduler.js
  - shouldYieldToHost

- isInputPending
- setImmediate
- MessageChannel