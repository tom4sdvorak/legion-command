    /**
     * Constructor for the UIComponent.
     * 
     * @param scene The Phaser Scene which owns this component.
     * @param x The central x position of the component.
     * @param y The central y position of the component.
     * @param width The width of the component.
     * @param height The height of the component.
     * @param background A number indicating the background image to use, 0 for the lighter one and 1 for the darker one.
     */
export class UIComponent extends Phaser.GameObjects.Container {
    private border: Phaser.GameObjects.NineSlice;
    private background: Phaser.GameObjects.Image;
    private sizeW: number;
    private sizeH: number;
    private scrollable: boolean = false;
    private borderStroke: Phaser.GameObjects.Graphics;
    private contentContainer: Phaser.GameObjects.Container;
    private contentMaskGraphics: Phaser.GameObjects.Graphics;
    private content: (Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[])[] = [];

    // For scrolling
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    private dragStartScrollY: number = 0;
    private scrollLimitsY: { minY: number, maxY: number } = { minY: 0, maxY: 0 };

    private order: ['left' | 'center' | 'right', 'top' | 'center' | 'bottom'] = ['center', 'center'];
    private gap: number = 16;
    private padding: number = 16;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, background: number, scrollable: boolean = false) {
        super(scene, x, y);
        this.sizeW = width;
        this.sizeH = height;
        this.setSize(width, height);
        this.scrollable = scrollable;
        let chosenBackground : string;
        switch (background) {
            case 0:
                chosenBackground = 'UI_bg_lighter';
                break;
            case 1:
                chosenBackground = 'UI_bg_darker';
                break;
            default:
                chosenBackground = 'UI_bg_lighter';
                break;
        }
        this.background = this.scene.add.image(-width/2, -height/2, chosenBackground);
        this.background.setOrigin(0, 0);
        this.background.setDisplaySize(width, height);
        this.add(this.background);

        this.borderStroke = this.scene.add.graphics();
        this.borderStroke.lineStyle(2, 0x000000);
        this.borderStroke.strokeRect(-width/2, -height/2, width, height);
        this.add(this.borderStroke);

        this.border = this.scene.add.nineslice(-width/2, -height/2, 'UI_border', undefined, width, height, 8, 8, 6, 6);
        this.border.setOrigin(0, 0);
        this.add(this.border);

        this.contentContainer = this.scene.add.container(0, 0);
        this.contentContainer.setSize(width - this.padding * 2, height - this.padding * 2);
        this.add(this.contentContainer);

        if(scrollable){
            this.contentMaskGraphics = this.scene.add.graphics();
            this.contentMaskGraphics.fillRect(
                -width / 2 + this.padding,
                -height / 2 + this.padding,
                width - (this.padding * 2),
                height - (this.padding * 2)
            );
            const mask = this.contentMaskGraphics.createGeometryMask();
            this.contentContainer.setMask(mask);

            this.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
            this.on('pointerdown', this.startDrag, this);
            this.on('pointerup', this.stopDrag, this);
            this.scene.input.on('pointermove', this.doDrag, this);
        }
    }

    public destroy(fromScene: boolean = true): void {
        this.border.destroy(fromScene);
        this.background.destroy(fromScene);
        this.borderStroke.destroy(fromScene);
        if (this.contentMaskGraphics) this.contentMaskGraphics.destroy(fromScene);
        this.contentContainer.destroy(fromScene);
        this.scene.input.off('pointermove', this.doDrag, this);
        /*for (const item of this.content) {
            if (Array.isArray(item)) {
                for (const gameObject of item) {
                    if (gameObject && gameObject.destroy) {
                        gameObject.destroy();
                    }
                }
            } else if (item && item.destroy) {
                item.destroy();
            }
        }
        this.content = [];*/
        super.destroy(fromScene);
    }

    public getWidth(): number {
        return this.sizeW;
    }

    public getHeight(): number {
        return this.sizeH;
    }

    /**
     * Returns the thickness of the border of this UI component in pixels.
     * @returns A number array with size of border in pixels: [left, right, top, bottom]
     */
    public getBorderThickness(): number[] {
        return [8,8,6,6]
    }

    /**
     * 
     * @returns Array with the content of the UI component
     */
    public getContent(): (Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[])[] {
        return this.content;
    }

    /**
     * 
     * @returns Number of items in the UI component's content array
     */
    public getContentLength(): number {
        return this.content.length;
    }

    /**
     * Changes tint of the UI elements borders and background separately
     * @param borderTint hex color to change to or -1 to clear
     * @param bgTint optional, hex color to change to or -1 to clear
     */
    public changeTint(borderTint: number, bgTint?: number): void {
        if(borderTint == -1){
            this.border.clearTint();
        }
        if(bgTint == -1){
            this.background.clearTint();
        }
        this.border.setTint(borderTint);
        if(bgTint !== undefined) this.background.setTint(bgTint);
    }

    /**
     * Adds gameObject into the UI and reorganizes all the content
     * @param element GameObject to add
     */
    public insertElement(element: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
        if(Array.isArray(element)){
            element.forEach(e => {
                if('displayHeight' in e){
                    this.contentContainer.add(e);
                }
                else{
                    console.error('UIComponent: insertElement() called with invalid element!');
                }
                
            });
            this.content.push(element);
        }
        else if('displayHeight' in element){
            this.contentContainer.add(element);
            this.content.push(element);
        }
        else{
            console.error('UIComponent: insertElement() called with invalid element!');
        }

        this.positionElements(this.order);
        
    }

    public setVisible(visible: boolean): this {
        this.emit('uicomponent-visibility-changed', visible);
        return super.setVisible(visible);
    }

    public setPadding(padding: number): void {
        this.padding = padding;
        this.contentContainer.setSize(this.sizeW - this.padding * 2, this.sizeH - this.padding * 2);
        if(this.contentMaskGraphics){
            this.contentMaskGraphics.clear();
            this.contentMaskGraphics.fillRect(
                -this.sizeW / 2 + this.padding,
                -this.sizeH / 2 + this.padding,
                this.sizeW - (this.padding * 2),
                this.sizeH - (this.padding * 2)
            );
        }
        this.positionElements(this.order);
    }

    public setGap(gap: number): void {
        this.gap = gap;
        this.positionElements(this.order);
    }

    /**
     * @param position an array of two strings ['left' | 'center' | 'right', 'top' | 'center' | 'bottom']
     * @param gap the distance between elements in pixels, default is the current gap
     * @param padding the distance between elements and the border in pixels, default is the current padding
     */
    positionElements(position: ['left' | 'center' | 'right', 'top' | 'center' | 'bottom'] = ['center', 'center'], gap: number = this.gap, padding: number = this.padding): void {
        this.order = position;
        this.gap = gap;
        this.padding = padding;

        // Helper function for typescript to check element properties/methods
        function isLayoutElement(element: any): element is { setPosition: Function, displayHeight: number, displayWidth: number, originY: number } {
            return 'setPosition' in element && 'displayHeight' in element && 'displayWidth' in element && 'originY' in element;
        }

        const itemCount = this.content.length;
        if(itemCount <= 0) {
            console.error('UIComponent: positionElements() called without any elements!');
            return;
        }

        // Calculate height of all elements
        const totalContentHeight = this.content.reduce((height, obj) => {
            // Check if the current item is an array and use the first element if it is
            const item = Array.isArray(obj) ? obj[0] : obj;
            if(isLayoutElement(item)){
                return height + item.displayHeight;
            }
            else{
                console.error('UIComponent: positionElements() called with invalid element!');
                return height;
            }
        }, 0) + (itemCount - 1) * this.gap;


        if(this.scrollable){
            const availableHeight = this.sizeH - (this.padding * 2);
            this.scrollLimitsY.maxY = 0; 
            if (totalContentHeight > availableHeight) {
                this.scrollLimitsY.minY = availableHeight - totalContentHeight;
                this.contentContainer.y = 0; 
            } else {
                this.scrollLimitsY.minY = 0;
                if (position[1] === 'center') {
                    this.contentContainer.y = -totalContentHeight / 2 + availableHeight / 2;
                }
            }
        }
        

        // Figure out starting vertical position
        let startY = 0;
        switch (position[1]) {
            case 'top':
                startY = 0;
                break;
            case 'bottom':
                startY = this.contentContainer.height - totalContentHeight;
                break;
            default:
                startY = -totalContentHeight / 2;
                break;
        }

        // Figure out starting horizontal position
        let startX, originX;
        switch (position[0]) {
            case 'left':
                startX = (-this.contentContainer.width / 2);
                originX = 0;
                break;
            case 'right':
                startX = (this.contentContainer.width / 2);
                originX = 1;
                break;
            default:
                startX = 0;
                originX = 0.5;
                break;
        }

        let posY = startY;
        // Loop thrugh all elements positioning them correctly
        this.content.forEach((element, index) => {
            // If element is instead array of elements, position them next to each other on current Y position, respecting horizontal align (left, center, right)
            if(Array.isArray(element)){
                if(element.length <= 0){
                    console.error('UIComponent: positionElements() called with empty array as element');
                    return;
                }
                // Calculate width of all elements in the array
                const totalContentWidth = element.reduce((width, obj) => {
                    if(isLayoutElement(obj)){
                        return width + obj.displayWidth;
                    }
                    else{
                        console.error('UIComponent: positionElements() called with invalid element!');
                        return width;
                    }
                }, 0) + (element.length - 1) * this.gap;
                let posX = startX;

                // Figure out starting horizontal position
                switch (position[0]) {
                    case 'center':   
                        posX = posX - totalContentWidth / 2; 
                        break;
                    case 'right':  
                        posX = posX-totalContentWidth;
                        break;
                    default: 
                        break;
                }

                // Loop thru the elements inside array and position them correctly in current row
                element.forEach(e => {
                    if(isLayoutElement(e)){
                        if(e instanceof Phaser.GameObjects.Container){
                            e.getAll().forEach(child => {
                                // @ts-ignore
                                if('setOrigin' in child) child.setOrigin(0, 0.5);
                            });
                        }
                        else{
                            // @ts-ignore
                            if('setOrigin' in e) e.setOrigin(0, 0.5);
                        }
                        e.setPosition(posX, posY + (e.displayHeight * e.originY));
                        posX += e.displayWidth + this.gap;
                    }
                });
                // Move to next row by height of first element in array and gap
                if(isLayoutElement(element[0])) posY += element[0].displayHeight + this.gap;
            }
            else{
                if(isLayoutElement(element)){
                    if(element instanceof Phaser.GameObjects.Container){
                        element.getAll().forEach(child => {
                            // @ts-ignore
                            if('setOrigin' in child) child.setOrigin(originX, 0.5);
                        });
                    }
                    else{
                        // @ts-ignore
                        if('setOrigin' in element) element.setOrigin(originX, 0.5);
                    }
                    element.setPosition(startX, posY + (element.displayHeight * element.originY));
                    posY += element.displayHeight + this.gap;
                    
                }
            }
        });
    }

    private getLocalY(globalY: number): number {
        return globalY - (this.y - this.sizeH / 2);
    }

    private startDrag(pointer: Phaser.Input.Pointer): void {
        // Only allow drag if content is overflowing
        if (this.scrollLimitsY.minY >= 0) return; 

        this.isDragging = true;
        this.dragStartY = this.getLocalY(pointer.y);
        this.dragStartScrollY = this.contentContainer.y;
    }

    private stopDrag(): void {
        this.isDragging = false;
    }

    private doDrag(pointer: Phaser.Input.Pointer): void {
        if (!this.isDragging) return;

        // Calculate movement difference since drag started
        const currentLocalY = this.getLocalY(pointer.y);
        const deltaY = currentLocalY - this.dragStartY;

        // Calculate new Y position, applying it to the scroll container
        let newY = this.dragStartScrollY + deltaY;

        // Clamp the position to ensure it stays within bounds
        newY = Phaser.Math.Clamp(newY, this.scrollLimitsY.minY, this.scrollLimitsY.maxY);

        this.contentContainer.y = newY;
    }
}
