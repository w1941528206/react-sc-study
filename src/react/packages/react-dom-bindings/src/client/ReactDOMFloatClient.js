/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                              

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals.js';
const {Dispatcher} = ReactDOMSharedInternals;
import {DOCUMENT_NODE} from '../shared/HTMLNodeType';
import {
  warnOnMissingHrefAndRel,
  validatePreloadResourceDifference,
  validateURLKeyedUpdatedProps,
  validateStyleResourceDifference,
  validateScriptResourceDifference,
  validateLinkPropsForStyleResource,
  validateLinkPropsForPreloadResource,
  validatePreloadArguments,
  validatePreinitArguments,
} from '../shared/ReactDOMResourceValidation';
import {createElement, setInitialProperties} from './ReactDOMComponent';
import {
  getResourcesFromRoot,
  markNodeAsResource,
} from './ReactDOMComponentTree';
import {HTML_NAMESPACE, SVG_NAMESPACE} from '../shared/DOMNamespaces';
import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';

// The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
                                                

                     
                 
               
                  
  
                        
                  
               
                          
                      
                    
  

                   
                    
               
                            
                  
  
                      
                

                           
                

                         
               
                     
                    

                      
                         

              
                     
                  
               
                     
                  
  
                    
              
                  
  
                       
                 
              
                     

                     
                  
  

                   
                  
  
                      
                
                    

                
                     
                 
  

                  
                  
  
                     
               
                  
                    
                                
                   

                
                     
                 
  

                  
               
              
                  
  
                     
               
                   

                
                     
                 
  

                     
               
                  
               

                
                     
                 
  

                               

                                                                               
                                                                                

                             
                                     
                                       
                                  
                                                
  

// Brief on purpose due to insertion by script when streaming late boundaries
// s = Status
// l = loaded
// e = errored
                                                                  

// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads
let lastCurrentDocument            = null;

let previousDispatcher = null;
export function prepareToRenderResources(rootContainer           ) {
  const rootNode = getRootNode(rootContainer);
  lastCurrentDocument = getDocumentFromRoot(rootNode);

  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
}

export function cleanupAfterRenderResources() {
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> FloatClient -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {preload, preinit};

                                              

// global maps of Resources
const preloadResources                               = new Map();

// getRootNode is missing from IE and old jsdom versions
function getRootNode(container           )            {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function'
    ? /* $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
       * but it's either a `Document` or `ShadowRoot`. */
      container.getRootNode()
    : container.ownerDocument;
}

function getCurrentResourceRoot()                   {
  const currentContainer = getCurrentRootHostContainer();
  // $FlowFixMe flow should know currentContainer is a Node and has getRootNode
  return currentContainer ? getRootNode(currentContainer) : null;
}

// This resource type constraint can be loosened. It really is everything except PreloadResource
// because that is the only one that does not have an optional instance type. Expand as needed.
function resetInstance(resource                               ) {
  resource.instance = undefined;
}

export function clearRootResources(rootContainer           )       {
  const rootNode = getRootNode(rootContainer);
  const resources = getResourcesFromRoot(rootNode);

  // We can't actually delete the resource cache because this function is called
  // during commit after we have rendered. Instead we detatch any instances from
  // the Resource object if they are going to be cleared

  // Styles stay put
  // Scripts get reset
  resources.scripts.forEach(resetInstance);
  // Head Resources get reset
  resources.head.forEach(resetInstance);
  // lastStructuredMeta stays put
}

// Preloads are somewhat special. Even if we don't have the Document
// used by the root that is rendering a component trying to insert a preload
// we can still seed the file cache by doing the preload on any document we have
// access to. We prefer the currentDocument if it exists, we also prefer the
// lastCurrentDocument if that exists. As a fallback we will use the window.document
// if available.
function getDocumentForPreloads()            {
  const root = getCurrentResourceRoot();
  if (root) {
    return root.ownerDocument || root;
  } else {
    try {
      return lastCurrentDocument || window.document;
    } catch (error) {
      return null;
    }
  }
}

function getDocumentFromRoot(root           )           {
  return root.ownerDocument || root;
}

// --------------------------------------
//      ReactDOM.Preload
// --------------------------------------
                              
                                                                                
function preload(href        , options                ) {
  if (__DEV__) {
    validatePreloadArguments(href, options);
  }
  const ownerDocument = getDocumentForPreloads();
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null &&
    ownerDocument
  ) {
    const as = options.as;
    const resource = preloadResources.get(href);
    if (resource) {
      if (__DEV__) {
        const originallyImplicit =
          (resource     )._dev_implicit_construction === true;
        const latestProps = preloadPropsFromPreloadOptions(href, as, options);
        validatePreloadResourceDifference(
          resource.props,
          originallyImplicit,
          latestProps,
          false,
        );
      }
    } else {
      const resourceProps = preloadPropsFromPreloadOptions(href, as, options);
      createPreloadResource(ownerDocument, href, resourceProps);
    }
  }
}

function preloadPropsFromPreloadOptions(
  href        ,
  as              ,
  options                ,
)               {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
  };
}

// --------------------------------------
//      ReactDOM.preinit
// --------------------------------------

                                    
                       
                
                      
                       
                     
  
function preinit(href        , options                ) {
  if (__DEV__) {
    validatePreinitArguments(href, options);
  }

  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const resourceRoot = getCurrentResourceRoot();
    const as = options.as;
    if (!resourceRoot) {
      // We are going to emit a preload as a best effort fallback since this preinit
      // was called outside of a render. Given the passive nature of this fallback
      // we do not warn in dev when props disagree if there happens to already be a
      // matching preload with this href
      const preloadDocument = getDocumentForPreloads();
      if (preloadDocument) {
        const preloadResource = preloadResources.get(href);
        if (!preloadResource) {
          const preloadProps = preloadPropsFromPreinitOptions(
            href,
            as,
            options,
          );
          createPreloadResource(preloadDocument, href, preloadProps);
        }
      }
      return;
    }

    switch (as) {
      case 'style': {
        const styleResources = getResourcesFromRoot(resourceRoot).styles;
        const precedence = options.precedence || 'default';
        let resource = styleResources.get(href);
        if (resource) {
          if (__DEV__) {
            const latestProps = stylePropsFromPreinitOptions(
              href,
              precedence,
              options,
            );
            validateStyleResourceDifference(resource.props, latestProps);
          }
        } else {
          const resourceProps = stylePropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          resource = createStyleResource(
            styleResources,
            resourceRoot,
            href,
            precedence,
            resourceProps,
          );
        }
        acquireResource(resource);
        return;
      }
      case 'script': {
        const src = href;
        const scriptResources = getResourcesFromRoot(resourceRoot).scripts;
        let resource = scriptResources.get(src);
        if (resource) {
          if (__DEV__) {
            const latestProps = scriptPropsFromPreinitOptions(src, options);
            validateScriptResourceDifference(resource.props, latestProps);
          }
        } else {
          const resourceProps = scriptPropsFromPreinitOptions(src, options);
          resource = createScriptResource(
            scriptResources,
            resourceRoot,
            src,
            resourceProps,
          );
        }
        acquireResource(resource);
        return;
      }
    }
  }
}

function preloadPropsFromPreinitOptions(
  href        ,
  as              ,
  options                ,
)               {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
  };
}

function stylePropsFromPreinitOptions(
  href        ,
  precedence        ,
  options                ,
)             {
  return {
    rel: 'stylesheet',
    href,
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin,
  };
}

function scriptPropsFromPreinitOptions(
  src        ,
  options                ,
)              {
  return {
    src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
  };
}

// --------------------------------------
//      Resources from render
// --------------------------------------

                             
                    
               
                     
                  
  
                               
                 
               
                  
  
                              
              
              
                  
  

function getTitleKey(child                 )         {
  return 'title:' + child;
}

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type        ,
  pendingProps       ,
  currentProps              ,
)                  {
  const resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error(
      '"resourceRoot" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'base': {
      const headRoot           = getDocumentFromRoot(resourceRoot);
      const headResources = getResourcesFromRoot(headRoot).head;
      const {target, href} = pendingProps;
      let matcher = 'base';
      matcher +=
        typeof href === 'string'
          ? `[href="${escapeSelectorAttributeValueInsideDoubleQuotes(href)}"]`
          : ':not([href])';
      matcher +=
        typeof target === 'string'
          ? `[target="${escapeSelectorAttributeValueInsideDoubleQuotes(
              target,
            )}"]`
          : ':not([target])';
      let resource = headResources.get(matcher);
      if (!resource) {
        resource = {
          type: 'base',
          matcher,
          props: Object.assign({}, pendingProps),
          count: 0,
          instance: null,
          root: headRoot,
        };
        headResources.set(matcher, resource);
      }
      return resource;
    }
    case 'meta': {
      let matcher, propertyString, parentResource;
      const {
        charSet,
        content,
        httpEquiv,
        name,
        itemProp,
        property,
      } = pendingProps;
      const headRoot           = getDocumentFromRoot(resourceRoot);
      const {head: headResources, lastStructuredMeta} = getResourcesFromRoot(
        headRoot,
      );
      if (typeof charSet === 'string') {
        matcher = 'meta[charset]';
      } else if (typeof content === 'string') {
        if (typeof httpEquiv === 'string') {
          matcher = `meta[http-equiv="${escapeSelectorAttributeValueInsideDoubleQuotes(
            httpEquiv,
          )}"][content="${escapeSelectorAttributeValueInsideDoubleQuotes(
            content,
          )}"]`;
        } else if (typeof property === 'string') {
          propertyString = property;
          matcher = `meta[property="${escapeSelectorAttributeValueInsideDoubleQuotes(
            property,
          )}"][content="${escapeSelectorAttributeValueInsideDoubleQuotes(
            content,
          )}"]`;

          const parentPropertyPath = property
            .split(':')
            .slice(0, -1)
            .join(':');
          parentResource = lastStructuredMeta.get(parentPropertyPath);
          if (parentResource) {
            // When using parentResource the matcher is not functional for locating
            // the instance in the DOM but it still serves as a unique key.
            matcher = parentResource.matcher + matcher;
          }
        } else if (typeof name === 'string') {
          matcher = `meta[name="${escapeSelectorAttributeValueInsideDoubleQuotes(
            name,
          )}"][content="${escapeSelectorAttributeValueInsideDoubleQuotes(
            content,
          )}"]`;
        } else if (typeof itemProp === 'string') {
          matcher = `meta[itemprop="${escapeSelectorAttributeValueInsideDoubleQuotes(
            itemProp,
          )}"][content="${escapeSelectorAttributeValueInsideDoubleQuotes(
            content,
          )}"]`;
        }
      }
      if (matcher) {
        let resource = headResources.get(matcher);
        if (!resource) {
          resource = {
            type: 'meta',
            matcher,
            property: propertyString,
            parentResource,
            props: Object.assign({}, pendingProps),
            count: 0,
            instance: null,
            root: headRoot,
          };
          headResources.set(matcher, resource);
        }
        if (typeof resource.property === 'string') {
          // We cast because flow doesn't know that this resource must be a Meta resource
          lastStructuredMeta.set(resource.property, (resource     ));
        }
        return resource;
      }
      return null;
    }
    case 'title': {
      const children = pendingProps.children;
      let child;
      if (Array.isArray(children)) {
        child = children.length === 1 ? children[0] : null;
      } else {
        child = children;
      }
      if (
        typeof child !== 'function' &&
        typeof child !== 'symbol' &&
        child !== null &&
        child !== undefined
      ) {
        // eslint-disable-next-line react-internal/safe-string-coercion
        const childString = '' + (child     );
        const headRoot           = getDocumentFromRoot(resourceRoot);
        const headResources = getResourcesFromRoot(headRoot).head;
        const key = getTitleKey(childString);
        let resource = headResources.get(key);
        if (!resource) {
          const titleProps = titlePropsFromRawProps(childString, pendingProps);
          resource = {
            type: 'title',
            props: titleProps,
            count: 0,
            instance: null,
            root: headRoot,
          };
          headResources.set(key, resource);
        }
        return resource;
      }
      return null;
    }
    case 'link': {
      const {rel} = pendingProps;
      switch (rel) {
        case 'stylesheet': {
          const styleResources = getResourcesFromRoot(resourceRoot).styles;
          let didWarn;
          if (__DEV__) {
            if (currentProps) {
              didWarn = validateURLKeyedUpdatedProps(
                pendingProps,
                currentProps,
                'style',
                'href',
              );
            }
            if (!didWarn) {
              didWarn = validateLinkPropsForStyleResource(pendingProps);
            }
          }
          const {precedence, href} = pendingProps;
          if (typeof href === 'string' && typeof precedence === 'string') {
            // We've asserted all the specific types for StyleQualifyingProps
            const styleRawProps                       = (pendingProps     );

            // We construct or get an existing resource for the style itself and return it
            let resource = styleResources.get(href);
            if (resource) {
              if (__DEV__) {
                if (!didWarn) {
                  const latestProps = stylePropsFromRawProps(styleRawProps);
                  if ((resource     )._dev_preload_props) {
                    adoptPreloadPropsForStyle(
                      latestProps,
                      (resource     )._dev_preload_props,
                    );
                  }
                  validateStyleResourceDifference(resource.props, latestProps);
                }
              }
            } else {
              const resourceProps = stylePropsFromRawProps(styleRawProps);
              resource = createStyleResource(
                styleResources,
                resourceRoot,
                href,
                precedence,
                resourceProps,
              );
              immediatelyPreloadStyleResource(resource);
            }
            return resource;
          }
          return null;
        }
        case 'preload': {
          if (__DEV__) {
            validateLinkPropsForPreloadResource(pendingProps);
          }
          const {href} = pendingProps;
          if (typeof href === 'string') {
            // We've asserted all the specific types for PreloadQualifyingProps
            const preloadRawProps                         = (pendingProps     );
            let resource = preloadResources.get(href);
            if (resource) {
              if (__DEV__) {
                const originallyImplicit =
                  (resource     )._dev_implicit_construction === true;
                const latestProps = preloadPropsFromRawProps(preloadRawProps);
                validatePreloadResourceDifference(
                  resource.props,
                  originallyImplicit,
                  latestProps,
                  false,
                );
              }
            } else {
              const resourceProps = preloadPropsFromRawProps(preloadRawProps);
              resource = createPreloadResource(
                getDocumentFromRoot(resourceRoot),
                href,
                resourceProps,
              );
            }
            return resource;
          }
          return null;
        }
        default: {
          const {href, sizes, media} = pendingProps;
          if (typeof rel === 'string' && typeof href === 'string') {
            const sizeKey =
              '::sizes:' + (typeof sizes === 'string' ? sizes : '');
            const mediaKey =
              '::media:' + (typeof media === 'string' ? media : '');
            const key = 'rel:' + rel + '::href:' + href + sizeKey + mediaKey;
            const headRoot = getDocumentFromRoot(resourceRoot);
            const headResources = getResourcesFromRoot(headRoot).head;
            let resource = headResources.get(key);
            if (!resource) {
              resource = {
                type: 'link',
                props: Object.assign({}, pendingProps),
                count: 0,
                instance: null,
                root: headRoot,
              };
              headResources.set(key, resource);
            }
            return resource;
          }
          if (__DEV__) {
            warnOnMissingHrefAndRel(pendingProps, currentProps);
          }
          return null;
        }
      }
    }
    case 'script': {
      const scriptResources = getResourcesFromRoot(resourceRoot).scripts;
      let didWarn;
      if (__DEV__) {
        if (currentProps) {
          didWarn = validateURLKeyedUpdatedProps(
            pendingProps,
            currentProps,
            'script',
            'src',
          );
        }
      }
      const {src, async} = pendingProps;
      if (async && typeof src === 'string') {
        const scriptRawProps                        = (pendingProps     );
        let resource = scriptResources.get(src);
        if (resource) {
          if (__DEV__) {
            if (!didWarn) {
              const latestProps = scriptPropsFromRawProps(scriptRawProps);
              if ((resource     )._dev_preload_props) {
                adoptPreloadPropsForScript(
                  latestProps,
                  (resource     )._dev_preload_props,
                );
              }
              validateScriptResourceDifference(resource.props, latestProps);
            }
          }
        } else {
          const resourceProps = scriptPropsFromRawProps(scriptRawProps);
          resource = createScriptResource(
            scriptResources,
            resourceRoot,
            src,
            resourceProps,
          );
        }
        return resource;
      }
      return null;
    }
    default: {
      throw new Error(
        `getResource encountered a resource type it did not expect: "${type}". this is a bug in React.`,
      );
    }
  }
}

function preloadPropsFromRawProps(
  rawBorrowedProps                        ,
)               {
  return Object.assign({}, rawBorrowedProps);
}

function titlePropsFromRawProps(
  child                 ,
  rawProps       ,
)             {
  const props             = Object.assign({}, rawProps);
  props.children = child;
  return props;
}

function stylePropsFromRawProps(rawProps                      )             {
  const props             = Object.assign({}, rawProps);
  props['data-precedence'] = rawProps.precedence;
  props.precedence = null;

  return props;
}

function scriptPropsFromRawProps(rawProps                       )              {
  const props              = Object.assign({}, rawProps);
  return props;
}

// --------------------------------------
//      Resource Reconciliation
// --------------------------------------

export function acquireResource(resource          )           {
  switch (resource.type) {
    case 'base':
    case 'title':
    case 'link':
    case 'meta': {
      return acquireHeadResource(resource);
    }
    case 'style': {
      return acquireStyleResource(resource);
    }
    case 'script': {
      return acquireScriptResource(resource);
    }
    case 'preload': {
      return resource.instance;
    }
    default: {
      throw new Error(
        `acquireResource encountered a resource type it did not expect: "${resource.type}". this is a bug in React.`,
      );
    }
  }
}

export function releaseResource(resource          )       {
  switch (resource.type) {
    case 'link':
    case 'title':
    case 'meta': {
      return releaseHeadResource(resource);
    }
    case 'style': {
      resource.count--;
      return;
    }
  }
}

function releaseHeadResource(resource              )       {
  if (--resource.count === 0) {
    // the instance will have existed since we acquired it
    const instance           = (resource.instance     );
    const parent = instance.parentNode;
    if (parent) {
      parent.removeChild(instance);
    }
    resource.instance = null;
  }
}

function createResourceInstance(
  type        ,
  props        ,
  ownerDocument          ,
)           {
  const element = createElement(type, props, ownerDocument, HTML_NAMESPACE);
  setInitialProperties(element, type, props);
  markNodeAsResource(element);
  return element;
}

function createStyleResource(
  styleResources                            ,
  root           ,
  href        ,
  precedence        ,
  props            ,
)                {
  if (__DEV__) {
    if (styleResources.has(href)) {
      console.error(
        'createStyleResource was called when a style Resource matching the same href already exists. This is a bug in React.',
      );
    }
  }

  const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
    href,
  );
  const existingEl = root.querySelector(
    `link[rel="stylesheet"][href="${limitedEscapedHref}"]`,
  );
  const resource = {
    type: 'style',
    count: 0,
    href,
    precedence,
    props,
    hint: null,
    preloaded: false,
    loaded: false,
    error: false,
    root,
    instance: null,
  };
  styleResources.set(href, resource);

  if (existingEl) {
    // If we have an existing element in the DOM we don't need to preload this resource nor can we
    // adopt props from any preload that might exist already for this resource. We do need to try
    // to reify the Resource loading state the best we can.
    const loadingState                             = (existingEl     )._p;
    if (loadingState) {
      switch (loadingState.s) {
        case 'l': {
          resource.loaded = true;
          break;
        }
        case 'e': {
          resource.error = true;
          break;
        }
        default: {
          attachLoadListeners(existingEl, resource);
        }
      }
    } else {
      // This is unfortunately just an assumption. The rationale here is that stylesheets without
      // a loading state must have been flushed in the shell and would have blocked until loading
      // or error. we can't know afterwards which happened for all types of stylesheets (cross origin)
      // for instance) and the techniques for determining if a sheet has loaded that we do have still
      // fail if the sheet loaded zero rules. At the moment we are going to just opt to assume the
      // sheet is loaded if it was flushed in the shell
      resource.loaded = true;
    }
  } else {
    const hint = preloadResources.get(href);
    if (hint) {
      // $FlowFixMe[incompatible-type]: found when upgrading Flow
      resource.hint = hint;
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      const preloadProps = hint.props;
      adoptPreloadPropsForStyle(resource.props, hint.props);
      if (__DEV__) {
        (resource     )._dev_preload_props = preloadProps;
      }
    }
  }

  return resource;
}

function adoptPreloadPropsForStyle(
  styleProps            ,
  preloadProps              ,
)       {
  if (styleProps.crossOrigin == null)
    styleProps.crossOrigin = preloadProps.crossOrigin;
  if (styleProps.referrerPolicy == null)
    styleProps.referrerPolicy = preloadProps.referrerPolicy;
  if (styleProps.title == null) styleProps.title = preloadProps.title;
}

function immediatelyPreloadStyleResource(resource               ) {
  // This function must be called synchronously after creating a styleResource otherwise it may
  // violate assumptions around the existence of a preload. The reason it is extracted out is we
  // don't always want to preload a style, in particular when we are going to synchronously insert
  // that style. We confirm the style resource has no preload already and then construct it. If
  // we wait and call this later it is possible a preload will already exist for this href
  if (resource.loaded === false && resource.hint === null) {
    const {href, props} = resource;
    const preloadProps = preloadPropsFromStyleProps(props);
    resource.hint = createPreloadResource(
      getDocumentFromRoot(resource.root),
      href,
      preloadProps,
    );
  }
}

function preloadPropsFromStyleProps(props            )               {
  return {
    rel: 'preload',
    as: 'style',
    href: props.href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function createScriptResource(
  scriptResources                             ,
  root           ,
  src        ,
  props             ,
)                 {
  if (__DEV__) {
    if (scriptResources.has(src)) {
      console.error(
        'createScriptResource was called when a script Resource matching the same src already exists. This is a bug in React.',
      );
    }
  }

  const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  const existingEl = root.querySelector(
    `script[async][src="${limitedEscapedSrc}"]`,
  );
  const resource = {
    type: 'script',
    src,
    props,
    root,
    instance: existingEl || null,
  };
  scriptResources.set(src, resource);

  if (!existingEl) {
    const hint = preloadResources.get(src);
    if (hint) {
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      const preloadProps = hint.props;
      adoptPreloadPropsForScript(props, hint.props);
      if (__DEV__) {
        (resource     )._dev_preload_props = preloadProps;
      }
    }
  } else {
    markNodeAsResource(existingEl);
  }

  return resource;
}

function adoptPreloadPropsForScript(
  scriptProps             ,
  preloadProps              ,
)       {
  if (scriptProps.crossOrigin == null)
    scriptProps.crossOrigin = preloadProps.crossOrigin;
  if (scriptProps.referrerPolicy == null)
    scriptProps.referrerPolicy = preloadProps.referrerPolicy;
  if (scriptProps.integrity == null)
    scriptProps.referrerPolicy = preloadProps.integrity;
}

function createPreloadResource(
  ownerDocument          ,
  href        ,
  props              ,
)                  {
  const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
    href,
  );
  let element                                = ownerDocument.querySelector(
    `link[rel="preload"][href="${limitedEscapedHref}"]`,
  );
  if (!element) {
    element = createResourceInstance('link', props, ownerDocument);
    insertResourceInstanceBefore(ownerDocument, element, null);
  } else {
    markNodeAsResource(element);
  }
  return {
    type: 'preload',
    href: href,
    ownerDocument,
    props,
    instance: element,
  };
}

function acquireHeadResource(resource              )           {
  resource.count++;
  let instance = resource.instance;
  if (!instance) {
    const {props, root, type} = resource;
    switch (type) {
      case 'title': {
        const titles = root.querySelectorAll('title');
        for (let i = 0; i < titles.length; i++) {
          if (titles[i].textContent === props.children) {
            instance = resource.instance = titles[i];
            markNodeAsResource(instance);
            return instance;
          }
        }
        instance = resource.instance = createResourceInstance(
          type,
          props,
          root,
        );
        const firstTitle = titles[0];
        insertResourceInstanceBefore(
          root,
          instance,
          firstTitle && firstTitle.namespaceURI !== SVG_NAMESPACE
            ? firstTitle
            : null,
        );
        break;
      }
      case 'meta': {
        let insertBefore = null;

        const metaResource               = (resource     );
        const {matcher, property, parentResource} = metaResource;

        if (parentResource && typeof property === 'string') {
          // This resoruce is a structured meta type with a parent.
          // Instead of using the matcher we just traverse forward
          // siblings of the parent instance until we find a match
          // or exhaust.
          const parent = parentResource.instance;
          if (parent) {
            let node = null;
            let nextNode = (insertBefore = parent.nextSibling);
            while ((node = nextNode)) {
              nextNode = node.nextSibling;
              if (node.nodeName === 'META') {
                const meta          = (node     );
                const propertyAttr = meta.getAttribute('property');
                if (typeof propertyAttr !== 'string') {
                  continue;
                } else if (
                  propertyAttr === property &&
                  meta.getAttribute('content') === props.content
                ) {
                  resource.instance = meta;
                  markNodeAsResource(meta);
                  return meta;
                } else if (property.startsWith(propertyAttr + ':')) {
                  // This meta starts a new instance of a parent structure for this meta type
                  // We need to halt our search here because even if we find a later match it
                  // is for a different parent element
                  break;
                }
              }
            }
          }
        } else if ((instance = root.querySelector(matcher))) {
          resource.instance = instance;
          markNodeAsResource(instance);
          return instance;
        }
        instance = resource.instance = createResourceInstance(
          type,
          props,
          root,
        );
        insertResourceInstanceBefore(root, instance, insertBefore);
        break;
      }
      case 'link': {
        const linkProps            = (props     );
        const limitedEscapedRel = escapeSelectorAttributeValueInsideDoubleQuotes(
          linkProps.rel,
        );
        const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
          linkProps.href,
        );
        let selector = `link[rel="${limitedEscapedRel}"][href="${limitedEscapedHref}"]`;
        if (typeof linkProps.sizes === 'string') {
          const limitedEscapedSizes = escapeSelectorAttributeValueInsideDoubleQuotes(
            linkProps.sizes,
          );
          selector += `[sizes="${limitedEscapedSizes}"]`;
        }
        if (typeof linkProps.media === 'string') {
          const limitedEscapedMedia = escapeSelectorAttributeValueInsideDoubleQuotes(
            linkProps.media,
          );
          selector += `[media="${limitedEscapedMedia}"]`;
        }
        const existingEl = root.querySelector(selector);
        if (existingEl) {
          instance = resource.instance = existingEl;
          markNodeAsResource(instance);
          return instance;
        }
        instance = resource.instance = createResourceInstance(
          type,
          props,
          root,
        );
        insertResourceInstanceBefore(root, instance, null);
        return instance;
      }
      case 'base': {
        const baseResource               = (resource     );
        const {matcher} = baseResource;
        const base = root.querySelector(matcher);
        if (base) {
          instance = resource.instance = base;
          markNodeAsResource(instance);
        } else {
          instance = resource.instance = createResourceInstance(
            type,
            props,
            root,
          );
          insertResourceInstanceBefore(
            root,
            instance,
            root.querySelector('base'),
          );
        }
        return instance;
      }
      default: {
        throw new Error(
          `acquireHeadResource encountered a resource type it did not expect: "${type}". This is a bug in React.`,
        );
      }
    }
  }
  return instance;
}

function acquireStyleResource(resource               )           {
  let instance = resource.instance;
  if (!instance) {
    const {props, root, precedence} = resource;
    const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
      props.href,
    );
    const existingEl = root.querySelector(
      `link[rel="stylesheet"][data-precedence][href="${limitedEscapedHref}"]`,
    );
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
      resource.preloaded = true;
      const loadingState                             = (existingEl     )._p;
      if (loadingState) {
        // if an existingEl is found there should always be a loadingState because if
        // the resource was flushed in the head it should have already been found when
        // the resource was first created. Still defensively we gate this
        switch (loadingState.s) {
          case 'l': {
            resource.loaded = true;
            resource.error = false;
            break;
          }
          case 'e': {
            resource.error = true;
            break;
          }
          default: {
            attachLoadListeners(existingEl, resource);
          }
        }
      } else {
        resource.loaded = true;
      }
    } else {
      instance = resource.instance = createResourceInstance(
        'link',
        resource.props,
        getDocumentFromRoot(root),
      );

      attachLoadListeners(instance, resource);
      insertStyleInstance(instance, precedence, root);
    }
  }
  resource.count++;
  return instance;
}

function acquireScriptResource(resource                )           {
  let instance = resource.instance;
  if (!instance) {
    const {props, root} = resource;
    const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(
      props.src,
    );
    const existingEl = root.querySelector(
      `script[async][src="${limitedEscapedSrc}"]`,
    );
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
    } else {
      instance = resource.instance = createResourceInstance(
        'script',
        resource.props,
        getDocumentFromRoot(root),
      );

      insertResourceInstanceBefore(getDocumentFromRoot(root), instance, null);
    }
  }
  return instance;
}

function attachLoadListeners(instance          , resource               ) {
  const listeners = {};
  listeners.load = onResourceLoad.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions,
  );
  listeners.error = onResourceError.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions,
  );

  instance.addEventListener(
    'load',
    listeners.load,
    loadAndErrorEventListenerOptions,
  );
  instance.addEventListener(
    'error',
    listeners.error,
    loadAndErrorEventListenerOptions,
  );
}

const loadAndErrorEventListenerOptions = {
  passive: true,
};

function onResourceLoad(
  instance          ,
  resource               ,
  listeners                         ,
  listenerOptions                                         ,
) {
  resource.loaded = true;
  resource.error = false;
  for (const event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}

function onResourceError(
  instance          ,
  resource               ,
  listeners                         ,
  listenerOptions                                         ,
) {
  resource.loaded = false;
  resource.error = true;
  for (const event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}

function insertStyleInstance(
  instance          ,
  precedence        ,
  root           ,
)       {
  const nodes = root.querySelectorAll(
    'link[rel="stylesheet"][data-precedence]',
  );
  const last = nodes.length ? nodes[nodes.length - 1] : null;
  let prior = last;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrecedence = node.dataset.precedence;
    if (nodePrecedence === precedence) {
      prior = node;
    } else if (prior !== last) {
      break;
    }
  }
  if (prior) {
    // We get the prior from the document so we know it is in the tree.
    // We also know that links can't be the topmost Node so the parentNode
    // must exist.
    ((prior.parentNode     )      ).insertBefore(instance, prior.nextSibling);
  } else {
    const parent =
      root.nodeType === DOCUMENT_NODE ? ((root     )          ).head : root;
    if (parent) {
      parent.insertBefore(instance, parent.firstChild);
    } else {
      throw new Error(
        'While attempting to insert a Resource, React expected the Document to contain' +
          ' a head element but it was not found.',
      );
    }
  }
}

function insertResourceInstanceBefore(
  ownerDocument          ,
  instance          ,
  before       ,
)       {
  if (__DEV__) {
    if (instance.tagName === 'LINK' && (instance     ).rel === 'stylesheet') {
      console.error(
        'insertResourceInstanceBefore was called with a stylesheet. Stylesheets must be' +
          ' inserted with insertStyleInstance instead. This is a bug in React.',
      );
    }
  }
  const parent = (before && before.parentNode) || ownerDocument.head;
  if (parent) {
    parent.insertBefore(instance, before);
  } else {
    throw new Error(
      'While attempting to insert a Resource, React expected the Document to contain' +
        ' a head element but it was not found.',
    );
  }
}

// When passing user input into querySelector(All) the embedded string must not alter
// the semantics of the query. This escape function is safe to use when we know the
// provided value is going to be wrapped in double quotes as part of an attribute selector
// Do not use it anywhere else
// we escape double quotes and backslashes
const escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n\"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value        )         {
  return value.replace(
    escapeSelectorAttributeValueInsideDoubleQuotesRegex,
    ch => '\\' + ch.charCodeAt(0).toString(16),
  );
}
