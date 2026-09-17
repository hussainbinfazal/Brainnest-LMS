import { useEffect } from "react";
type ClickOutSideRef = React.RefObject<HTMLElement | null>;


export const useClickOutSide = (
    refs: ClickOutSideRef[],
    onOutSideClick: () => void,
    enabled = true
): void => {
    useEffect(() => {
        if (!enabled) return

        const handleClickOutSide = (event: MouseEvent): void => {
            const target = event.target as Node;

            if (!(target instanceof Node)) return

            const clickedInside = refs.some((ref) =>
                ref?.current?.contains(target));

            if (!clickedInside) onOutSideClick();

        }
        document.addEventListener('mousedown', handleClickOutSide);

        return () => {
            document.removeEventListener('mousedown', handleClickOutSide);
        }
    }, [refs, onOutSideClick, enabled])
}