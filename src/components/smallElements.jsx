import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"

export const Container = styled(Motion.div)`
    /* padding: 1.5em; */
    box-sizing: border-box;
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    height: 100%;
    z-index: 1;
`

export const Centered = styled(Container)`
    align-items: center;
    justify-content: space-evenly;
    margin: auto;
`

export const FitHeight = styled(Motion.div)`
    margin-bottom: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
`

export const FitHeightScrollable = styled(FitHeight)`
    overflow-y: auto;
`

export const BigTitle = styled(Motion.p)`
    font-size: var(--font-size-xxxlarge);
    font-family: ${(props) => props.fontFamily ?? "SebinoSoftBold"};
    line-height: 100%;
    color: ${(props) => props.color ?? props.color};
    margin: 0;
`

export const Title = styled(Motion.p)`
    font-size: var(--font-size-xxxlarge);
    font-family: "SebinoSoftBold";
    line-height: 130%;
    color: ${(props) => props.color ?? 'var(--color-primary)'};
    vertical-align: text-top;
    margin: 0;

    span {
        vertical-align: text-top;
    }
`

export const SubTitle = styled(Motion.p)`
    font-size: var(--font-size-xxlarge);
    font-family: "SebinoSoftMedium";
    line-height: 130%;
    color: ${(props) => props.color ?? 'var(--color-secondary)'};
    vertical-align: text-top;
    margin: 0;
    
    span {
        vertical-align: text-top;
    }
`
