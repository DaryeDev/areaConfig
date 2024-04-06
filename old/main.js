const panes = document.querySelectorAll('.pane')

let z = 1

panes.forEach((pane) => {
  pane.style.minWidth = pane.getAttribute('minWidth') + 'px'
  pane.style.minHeight = pane.getAttribute('minHeight') + 'px'
  pane.style.setProperty("--areaColor", pane.getAttribute('areaColor'));

  if (pane.hasAttribute('resizeable')) {
    pane.innerHTML += '<div class="corner up"></div><div class="corner down"></div><div class="corner left"></div><div class="corner right"></div><div class="corner upleft"></div><div class="corner upright"></div><div class="corner downleft"></div><div class="corner downright"></div>'
  } else {
    pane.classList.add('hasBorder')
  }


  const corners = pane.querySelectorAll('.corner')
  corners.forEach((corner) => {
    corner.addEventListener('mousedown', (event) => {
      let w = pane.clientWidth
      let h = pane.clientHeight

      let l = pane.offsetLeft
      let t = pane.offsetTop
  
      let startX = event.pageX
      let startY = event.pageY
  
      const drag = (event) => {
        event.preventDefault()

        switch (corner.classList[1]) {
          case 'downright':
            pane.style.width = w + (event.pageX - startX) + 'px'
            pane.style.height = h + (event.pageY - startY) + 'px'
            break;

          case 'upright':
            pane.style.width = w + (event.pageX - startX) + 'px'

            if ((h - (event.pageY - startY)) <= parseInt(window.getComputedStyle(pane).minHeight.replace("px", ""))) {
              pane.style.height = pane.getAttribute('minHeight')
            } else {
              pane.style.top = t + (event.pageY - startY) + 'px'
              pane.style.height = h - (event.pageY - startY) + 'px'
            }
            break;

          case 'upleft':
            if ((h - (event.pageY - startY)) <= parseInt(window.getComputedStyle(pane).minHeight.replace("px", ""))) {
              pane.style.height = pane.getAttribute('minHeight')
            } else {
              pane.style.top = t + (event.pageY - startY) + 'px'
              pane.style.height = h - (event.pageY - startY) + 'px'
            }

            if ((w - (event.pageX - startX)) <= parseInt(window.getComputedStyle(pane).minHeight.replace("px", ""))) {
              pane.style.width = pane.getAttribute('minWidth')
            } else {
              pane.style.width = w - (event.pageX - startX) + 'px'
              pane.style.left = l + (event.pageX - startX) + 'px'
            }
            break;

          case 'downleft':
            pane.style.height = h + (event.pageY - startY) + 'px'

            if ((w - (event.pageX - startX)) <= parseInt(window.getComputedStyle(pane).minWidth.replace("px", ""))) {
              pane.style.width = pane.getAttribute('minWidth')
            } else {
              pane.style.width = w - (event.pageX - startX) + 'px'
              pane.style.left = l + (event.pageX - startX) + 'px'
            }
            break;

          case 'up':
            if ((h - (event.pageY - startY)) <= parseInt(window.getComputedStyle(pane).minHeight.replace("px", ""))) {
              pane.style.height = pane.getAttribute('minHeight')
            } else {
              pane.style.top = t + (event.pageY - startY) + 'px'
              pane.style.height = h - (event.pageY - startY) + 'px'
            }
            break;

          case 'down':
            pane.style.height = h + (event.pageY - startY) + 'px'
            break;
          
          case 'left':
            if ((w - (event.pageX - startX)) <= parseInt(window.getComputedStyle(pane).minWidth.replace("px", ""))) {
              pane.style.width = pane.getAttribute('minWidth')
            } else {
              pane.style.width = w - (event.pageX - startX) + 'px'
              pane.style.left = l + (event.pageX - startX) + 'px'
            }
            break;
          
          case 'right':
            pane.style.width = w + (event.pageX - startX) + 'px'
            break;
        
          default:
            break;
        }
  
      }
  
      const mouseup = () => {
        document.removeEventListener('mousemove', drag)
        document.removeEventListener('mouseup', mouseup)
      }
  
      document.addEventListener('mousemove', drag)
      document.addEventListener('mouseup', mouseup)
    })
  })


  pane.addEventListener('mousedown', (event) => {
    z = z + 1
    pane.style.zIndex = z

    const targetIsCorner = Array.from(corners).includes(event.target)
    if (targetIsCorner) return

    pane.classList.add('is-dragging')

    let l = pane.offsetLeft
    let t = pane.offsetTop

    let startX = event.pageX
    let startY = event.pageY

    const drag = (event) => {
      event.preventDefault()

      pane.style.left = l + (event.pageX - startX) + 'px'
      pane.style.top = t + (event.pageY - startY) + 'px'
    }

    const mouseup = () => {
      pane.classList.remove('is-dragging')

      document.removeEventListener('mousemove', drag)
      document.removeEventListener('mouseup', mouseup)
    }

    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', mouseup)
  })
})
