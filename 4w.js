function w4( selector ) {

   listeners = {}

   function setFocus() {
      editor.focus()      
   }

   function ExecCommand(command, data) {
      if(command === 'h1' || command === 'h2' || command === 'h3' || command === 'h4' || command === 'h5' || command === 'h6') {
            document.execCommand('formatBlock', false, '<'+command+'>')
            setFocus()            
      }

      document.execCommand(command, false, data)
      setFocus()
   }
   
   function CleanPastedHTML(input) {
      // 1. remove line breaks / Mso classes
      var stringStripper = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g;
      var output = input.replace(stringStripper, ' ');
      // 2. strip Word generated HTML comments
      var commentSripper = new RegExp('<!--(.*?)-->','g');
      var output = output.replace(commentSripper, '');
      var tagStripper = new RegExp('<(/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>','gi');
      // 3. remove tags leave content if any
      output = output.replace(tagStripper, '');
      // 4. Remove everything in between and including tags '<style(.)style(.)>'
      var badTags = ['style', 'script','applet','embed','noframes','noscript'];
   
      for (var i=0; i< badTags.length; i++) {
         tagStripper = new RegExp('<'+badTags[i]+'.*?'+badTags[i]+'(.*?)>', 'gi');
         output = output.replace(tagStripper, '');
      }
      // 5. remove attributes ' style="..."'
      var badAttributes = ['style', 'start'];
      for (var i=0; i< badAttributes.length; i++) {
         var attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"','gi');
         output = output.replace(attributeStripper, '');
      }
      
      return output;
   }
   
   function handleKeyDown(e) {
      var ctrl = e.ctrlKey || e.metaKey
      var keyCode = e.which || e.keyCode
      if(ctrl) {
         hotKeyCtrl(e, keyCode)
      } else {
         keyPress(e, keyCode)
      }
   }
   
   function handlePaste( e ) {
      var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
      var outputText = CleanPastedHTML(bufferText)
   
      event.preventDefault()
      event.stopPropagation()
   
      ExecCommand('insertText', bufferText);
   }
   
   function hotKeyCtrl( event, keyCode ) {
      if(keyCode === 66) {
         execCommandHotKey(event, 'bold')
      }
   
      if(keyCode === 73) {
         execCommandHotKey(event, 'italic')
      }
   
      if(keyCode === 85) {
         execCommandHotKey(event, 'underline')
      }
   }
   
   function keyPress( event, keyCode ) {
      if(keyCode === 9) {
         ExecCommand('insertHTML', '&emsp;')
         event.preventDefault()
      }
   }
   
   function execCommandHotKey( event, command ) {
      event.preventDefault()
      event.stopPropagation()
      ExecCommand(command)
   }
   
   function verfifyProperty( property ) {
   
      var range = document.getSelection().getRangeAt(0);
      var container = range.commonAncestorContainer;
      if (container.nodeType == 3) {container = container.parentNode;}
      
      if(property === 'link') {
         if(container.nodeName === "A") {
            return true
         }
      }

      if(property === 'h1' && container.nodeName === "H1") return true
      if(property === 'h2' && container.nodeName === "H2") return true
      if(property === 'h3' && container.nodeName === "H3") return true
      if(property === 'h4' && container.nodeName === "H4") return true
      if(property === 'h5' && container.nodeName === "H5") return true
      if(property === 'h6' && container.nodeName === "H6") return true
   
      if(document.queryCommandState(property)) {
         return true
      }

      return false
   }

   var properties = {
      'bold' : false,
      'italic' : false,
      'underline' : false,
      'justifyleft' : false,
      'justifycenter' : false,
      'justifyright' : false,
      'insertunorderedlist' : false,
      'insertorderedlist' : false,
      'link' : false,
      'h1' : false,
      'h2' : false,
      'h3' : false,
      'h4' : false,
      'h5' : false,
      'h6' : false
   }
   
   function readProperties() {
      var selection = window.getSelection();
      if(selection !== '') {

         var items = Object.keys(properties)

         for (let index = 0; index < items.length; index++) {
            const element = items[index]

            var has = verfifyProperty(element)
            if(has !== properties[element]) {
               properties[element] = has

               if(has) {
                  hasProperty(element)
               } else {
                  removedProperty(element)
               }
            }
         }
      }
   }

   function onImageRemove( e ) {
      if(listeners.imageRemoved)
            listeners.imageRemoved(e.target)
   }
   
   this.command = function( action, parameter ) {
      var selection = document.getSelection()
      ExecCommand(action, parameter)
      var element = selection.anchorNode.lastChild

      change()

      if(action.toLowerCase() === 'insertimage') {
            element.addEventListener('DOMNodeRemovedFromDocument', onImageRemove, false);            
      }

      return element
   }
   
   function hasProperty( property ) {
      if(listeners.hasProperty)
         listeners.hasProperty( property )
   }

   function removedProperty( property ) {
      if(listeners.removedProperty)
         listeners.removedProperty( property )
   }

   this.listener = function( listener, action ) {
      listeners[listener] = action
   }

   var editor = document.querySelector(selector)
   editor.designMode = 'on'
   editor.contentEditable = true
   editor.addEventListener('keydown', handleKeyDown, false)
   editor.addEventListener('paste', handlePaste, false)

   var lastContent = editor.innerHTML

   var change = function(e) {
      if(e)
      e.stopPropagation()

      readProperties( e )

      setTimeout(function() {
         if(lastContent !== editor.innerHTML) {
            
            if(this.listeners.change)
               this.listeners.change(editor.innerHTML)

            lastContent = editor.innerHTML
         }
      }, 20)
   }

   document.execCommand('defaultParagraphSeparator', false, 'p');   

   var blurListener = null
   var focusListener = null
   var focus = false

   editor.addEventListener('keyup', change, false) 
   editor.addEventListener('paste', change, false) 
   editor.addEventListener('cut', change, false) 
   editor.addEventListener('mouseup', change, false)
   editor.addEventListener('keydown', change, false)
   editor.addEventListener('focus', function( e ) {
      if(listeners.focus && !focus)
            focusListener = setTimeout(() => {
                  listeners.focus(e)   
                  focus = true                  
            }, 20);
      
      clearTimeout(blurListener)
   }, false)

   editor.addEventListener('blur', function( e ) {
      if(listeners.blur && focus)
            blurListener = setTimeout(() => {
                  listeners.blur(e)         
                  focus = false
            }, 20);

      clearTimeout(focusListener)            
   }, false)

   var imgs = editor.querySelectorAll('img')
   for (let index = 0; index < imgs.length; index++) {
         const element = imgs[index];
         element.addEventListener('DOMNodeRemovedFromDocument', onImageRemove, false);
   }
}

