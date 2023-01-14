import React, { useCallback, useEffect, useRef, useState } from 'react'
import { faTimes } from '@fortawesome/pro-light-svg-icons'
import { AbsoluteOverlay as LoadingOverlay } from '../Indicators'
import { IconButton } from '../Navigation'
import { useEventListener } from '@mbari/utils'
import clsx from 'clsx'
import { Footer, FooterProps } from './Footer'

export interface ModalViewProps {
  title: string | JSX.Element
  open: boolean
  zIndex?: string
  grayHeader?: boolean
  fullWidthBody?: boolean
  extraWideModal?: boolean
  bodyOverflowHidden?: boolean
  onClose?: () => void
  draggable?: boolean
  onFocus?: () => void
  loading?: boolean
  maximized?: boolean
  className?: string
  style?: React.CSSProperties
  snapTo?:
    | 'top-right'
    | 'bottom-right'
    | 'top-left'
    | 'bottom-left'
    | 'all-sides'
  allowPointerEventsOnChildren?: boolean
}

export type ModalProps = ModalViewProps & FooterProps
export type ModalPropsWithoutTitle = Omit<ModalProps, 'title'>

interface Coordinate {
  x: number
  y: number
}

interface ModalDragState {
  origin: Coordinate
  translate: Coordinate
  mouse: Coordinate
  onMouseUp?: EventListener
  onMouseMove?: EventListener
  dragging: boolean
}

const DEFAULT_STATE: ModalDragState = {
  origin: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  translate: { x: 0, y: 0 },
  dragging: false,
}

const styles = {
  overlay: 'fixed inset-0 w-screen h-screen font-display',
  overlayToContainModalSize: 'flex flex-col items-center justify-center',
  allowPointerEventsOnChildren: 'pointer-events-none',
  modal:
    'flex flex-col bg-white w-full overflow-hidden rounded-md border pointer-events-auto transition-shadow transition-colors duration-300 ease-out relative my-12',
  snapToCenter: 'm-auto',
  snapToTopLeft: 'mt-0 mr-0 mb-auto mr-auto',
  snapToTopRight: 'mt-0 mr-0 mb-auto ml-auto',
  snapToBottomLeft: 'mb-0 mr-0 mt-auto mr-auto',
  snapToBottomRight: 'mb-0 mr-0 mt-auto ml-auto',
  snapToAllSides: 'inset-0',
  defaultModalHeight: 'md:max-h-3/4',
  // 'flex flex-col bg-white w-full overflow-hidden md:max-h-3/4 rounded-md border m-auto pointer-events-auto transition-shadow transition-colors duration-300 ease-out relative',
  defaultModalWidth: 'md:max-w-md lg:max-w-lg',
  extraWideModalWidth: 'md:max-w-3xl lg:max-w-5xl',
  maximizedModalWidth: 'md:max-w-[90%]',
  header: 'flex justify-between bg-stone-100 rounded mt-0',
  title:
    'text-stone-900 font-medium text-md font-display mt-auto pt-6 px-4 w-full',
  dragButton:
    'cursor-move flex flex-grow bg-opacity-50 hover:bg-stone-100 ml-1 my-1 rounded transition-colors duration-100 ease-out',
  closeButton: 'my-1 mr-2 text-stone-400',
  modalBody: 'flex flex-col flex-grow text-base font-normal',
  modalScroll: 'overflow-auto',
  bodyMarginAndPadding: 'mb-6 px-4 py-4',
  notDragging: 'shadow-xl border-stone-100',
  dragging: 'shadow-2xl border-stone-200',
}

export const Modal: React.FC<ModalProps & FooterProps> = ({
  title,
  open,
  grayHeader,
  fullWidthBody,
  extraWideModal,
  bodyOverflowHidden,
  onClose: handleOnClose,
  children,
  draggable,
  onFocus: handleFocus,
  zIndex = 'z-[1002]',
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  cancelButtonText,
  confirmButtonText,
  disableCancel,
  disableConfirm,
  form,
  loading,
  extraButtons,
  maximized,
  className,
  style,
  snapTo,
  allowPointerEventsOnChildren,
}) => {
  const browserWindow = typeof window !== 'undefined' ? window : undefined
  const [state, setState] = useState<ModalDragState>(DEFAULT_STATE)
  const dialog = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) {
      setState(DEFAULT_STATE)
    }
  }, [open])

  const { dragging, translate, mouse } = state
  useEffect(() => {
    if (dragging && dialog.current) {
      const minX = -dialog.current.offsetLeft - dialog.current.offsetWidth / 2
      const minY = -dialog.current.offsetTop
      const maxY =
        window.innerHeight -
        dialog.current.offsetHeight / 2 +
        dialog.current.offsetTop
      const maxX =
        window.innerWidth -
        dialog.current.offsetWidth / 2 -
        dialog.current.offsetLeft
      const x = Math.min(maxX, Math.max(minX, mouse.x - state.origin.x))
      const y = Math.min(maxY, Math.max(minY, mouse.y - state.origin.y))
      dialog.current.style.transform = `translate(${x}px, ${y}px)`
      if (translate.x !== x || translate.y !== y) {
        setState({ ...state, translate: { x, y } })
      }
    }
  }, [mouse, dialog, translate, dragging, state, setState])

  // Update mouse pos on move...
  const onMouseMove: EventListener = useCallback(
    (e) => {
      if (dragging) {
        e.preventDefault()
        setState({
          ...state,
          mouse: { x: (e as MouseEvent).pageX, y: (e as MouseEvent).pageY },
        })
      }
    },
    [dragging, state, setState]
  )
  useEventListener({
    type: 'mousemove',
    element: browserWindow,
    listener: onMouseMove,
  })

  // Reset dragging state on mouse up.
  const onMouseUp: EventListener = useCallback(
    (e) => {
      if (dragging) {
        e.preventDefault()
        setState({ ...DEFAULT_STATE, translate })
      }
    },
    [dragging, translate, setState]
  )
  useEventListener({
    type: 'mouseup',
    element: browserWindow,
    listener: onMouseUp,
  })

  const handleMouseDown: React.MouseEventHandler = (e) => {
    e.preventDefault()
    setState({
      ...state,
      dragging: true,
      origin: { x: e.pageX - translate.x, y: e.pageY - translate.y },
      mouse: { x: e.pageX, y: e.pageY },
    })
    handleFocus?.()
  }

  return open ? (
    <div
      className={clsx(
        styles.overlay,
        zIndex,
        !bodyOverflowHidden
          ? 'overflow-auto'
          : styles.overlayToContainModalSize,
        allowPointerEventsOnChildren && styles.allowPointerEventsOnChildren
      )}
    >
      <section
        className={clsx(
          styles.modal,
          maximized && styles.maximizedModalWidth,
          !maximized && extraWideModal && styles.extraWideModalWidth,
          !maximized && !extraWideModal && styles.defaultModalWidth,
          !bodyOverflowHidden && styles.defaultModalHeight,
          dragging ? styles.dragging : styles.notDragging,
          snapTo === 'top-right' && styles.snapToTopRight,
          snapTo === 'top-left' && styles.snapToTopLeft,
          snapTo === 'bottom-right' && styles.snapToBottomRight,
          snapTo === 'bottom-left' && styles.snapToBottomLeft,
          snapTo === 'all-sides' && styles.snapToAllSides,
          !snapTo && styles.snapToCenter,
          className
        )}
        style={style}
        ref={dialog}
      >
        {loading && <LoadingOverlay />}
        <header className={clsx(styles.header, !grayHeader && 'bg-opacity-10')}>
          {draggable ? (
            <button onMouseDown={handleMouseDown} className={styles.dragButton}>
              <h2 className={styles.title}>{title}</h2>
            </button>
          ) : typeof title === 'string' ? (
            <h2 className={styles.title}>{title}</h2>
          ) : (
            <div className={styles.title}>{title}</div>
          )}
          {handleOnClose ? (
            <IconButton
              icon={faTimes}
              tooltip="close"
              onClick={handleOnClose}
              ariaLabel="close"
              className={styles.closeButton}
              size="text-2xl"
            />
          ) : null}
        </header>
        <div
          className={clsx(
            styles.modalBody,
            !fullWidthBody && styles.bodyMarginAndPadding,
            bodyOverflowHidden ? 'overflow-hidden' : 'overflow-auto'
          )}
        >
          {children}
        </div>
        {(handleConfirm || handleCancel || form) && (
          <Footer
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            cancelButtonText={cancelButtonText}
            confirmButtonText={confirmButtonText}
            disableCancel={disableCancel}
            disableConfirm={disableConfirm}
            form={form}
            extraButtons={extraButtons}
          />
        )}
      </section>
    </div>
  ) : null
}

Modal.displayName = 'Modal'
