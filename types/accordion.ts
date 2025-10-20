
export interface Accordion {
    id: string,
    title: string,
    subtitle: string,
    content: string,
}

export interface Accordions {
    items: Array<Accordion>
}