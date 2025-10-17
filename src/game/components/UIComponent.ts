import { UI } from "../scenes/UI";

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
    private fixedContent: (Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[])[] = [];

    // For scrolling
    private isDragging: boolean = false;
    private wasDragged: boolean = false;
    private dragStartY: number = 0;
    private dragStartX: number = 0;
    private dragStartScrollY: number = 0;
    private dragStartScrollX: number = 0;
    private scrollLimitsY: { minY: number, maxY: number } = { minY: 0, maxY: 0 };
    private scrollLimitsX: { minX: number, maxX: number } = { minX: 0, maxX: 0 };
    private dragThreshold: number = 8;

    private order: ['left' | 'center' | 'right', 'top' | 'center' | 'bottom'] = ['center', 'center'];
    private marginBottom: number = 16;
    private marginRight: number = 16;
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

        if(scrollable) {
            this.contentMaskGraphics = this.scene.add.graphics();
            this.createMask();
            this.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
            this.on('pointerdown', this.startDrag, this);
        }
    }

    public destroy(fromScene: boolean = true): void {
        this.border.destroy(fromScene);
        this.background.destroy(fromScene);
        this.borderStroke.destroy(fromScene);
        if (this.contentMaskGraphics) this.contentMaskGraphics.destroy(fromScene);
        this.contentContainer.destroy(fromScene);
        this.removeAllListeners();
        super.destroy(fromScene);
    }

    private createMask(){
        if(this.contentMaskGraphics) this.contentMaskGraphics.clear();
        //this.contentMaskGraphics.fillStyle(0x000000, 0.5).setDepth(9999999);
        this.contentMaskGraphics.fillRect(
            -this.sizeW / 2 + this.padding,
            -this.sizeH / 2 + this.padding,
            this.sizeW - this.padding * 2,
            this.sizeH - this.padding * 2
        );
        this.contentMaskGraphics.setPosition(this.x, this.y);
        const mask = this.contentMaskGraphics.createGeometryMask();
        this.contentContainer.setMask(mask);
    }

    public getWidth(): number {
        return this.sizeW;
    }

    public getHeight(): number {
        return this.sizeH;
    }

    public getWasDragged(): boolean {
        return this.wasDragged;
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
     * @returns NineSlice GameObject that creates the textured border of this UI
     */
    public getBorder(): Phaser.GameObjects.NineSlice {
        return this.border;
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
     * @param sendToBack if true, the element will be added to the back of the UI
     * @param isFixed if true, the element will be added as fixed element that will never scroll
     */
    public insertElement(element: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[], isFixed?: boolean): void {
        const targetArray = isFixed ? this.fixedContent : this.content;
        const targetContainer = isFixed ? this : this.contentContainer;

        if(Array.isArray(element)){
            element.forEach(e => {
                if('displayHeight' in e){
                    targetContainer.add(e);
                    if(e instanceof Phaser.GameObjects.Line) targetContainer.sendToBack(e); // Makes all lines be in the background of any other element over them
                       
                }
                else{
                    console.error('UIComponent: insertElement() called with invalid element!');
                }
                
            });
            targetArray.push(element);
        }
        else if('displayHeight' in element){
            targetContainer.add(element);
            targetArray.push(element);
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
        this.createMask();
        this.positionElements(this.order);
    }

    public setMargin(right: number, bottom: number): void {
        this.marginBottom = bottom;
        this.marginRight = right;
        this.positionElements(this.order);
    }

    /**
     * @param position an array of two strings ['left' | 'center' | 'right', 'top' | 'center' | 'bottom']
     * @param marginRight the distance between one element and the one on the right of it
     * @param marginBottom the distance between one element and the one below it
     * @param padding the distance between elements and the border in pixels, default is the current padding
     */
    positionElements(position: ['left' | 'center' | 'right', 'top' | 'center' | 'bottom'] = ['center', 'center'], marginRight: number = this.marginRight, marginBottom: number = this.marginBottom, padding: number = this.padding): void {
        this.order = position;
        this.marginBottom = marginBottom;
        this.marginRight = marginRight;
        this.padding = padding;

        // Helper function for typescript to check element properties/methods
        function isLayoutElement(element: any): element is { setPosition: Function, displayHeight: number, displayWidth: number, originY: number } {
            return 'setPosition' in element && 'displayHeight' in element && 'displayWidth' in element && 'originY' in element;
        }

        const itemCount = this.content.length;
        /*if(itemCount <= 0 && this.fixedContent.length <= 0){ {
            console.error('UIComponent: positionElements() called without any elements!');
            return;
        }*/

        // Calculate height of all (non-fixed) elements
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
        }, 0) + (itemCount - 1) * this.marginBottom;

        // Calculate width of largestnon-fixed element (or sum of elements if they are inside array)
        const totalContentWidth = this.content.reduce((width, obj) => {
            if(Array.isArray(obj)){
                let rowWidth = 0;
                for(const item of obj){
                    if(isLayoutElement(item)){
                        rowWidth += item.displayWidth;
                    }
                    else{
                        console.error('UIComponent: positionElements() called with invalid element!');
                        return width;
                    }
                }
                return Math.max(width, rowWidth+(obj.length-1)*this.marginRight);
            }
            else{
                if(isLayoutElement(obj)){
                    return Math.max(width, obj.displayWidth);
                }
                else{
                    console.error('UIComponent: positionElements() called with invalid element!');
                    return width;
                }
            }
        }, 0);

        if(this.scrollable){
            const availableHeight = this.sizeH - (this.padding * 2);
            this.scrollLimitsY.maxY = 0; 
            if (totalContentHeight > availableHeight) {
                this.scrollLimitsY.minY = availableHeight - totalContentHeight;
                this.contentContainer.y = 0; 
            } else {
                this.scrollLimitsY.minY = 0;
                if (position[1] === 'center') {
                    //this.contentContainer.y = -totalContentHeight / 2 + availableHeight / 2;
                }
            }
            this.contentContainer.y = Phaser.Math.Clamp(this.contentContainer.y, this.scrollLimitsY.minY, this.scrollLimitsY.maxY);

            const availableWidth = this.sizeW - (this.padding * 2);
            this.scrollLimitsX.maxX = 0; 
            if (totalContentWidth > availableWidth) {
                this.scrollLimitsX.minX = availableWidth - totalContentWidth;
            } else {
                this.scrollLimitsX.minX = 0;
            }
            this.contentContainer.x = Phaser.Math.Clamp(this.contentContainer.x, this.scrollLimitsX.minX, this.scrollLimitsX.maxX);
        }

        // Calculate height of any fixed content
        const fixedContentHeight = this.fixedContent.reduce((height, obj) => {
            const item = Array.isArray(obj) ? obj[0] : obj;
            if(isLayoutElement(item)){
                return height + item.displayHeight + this.marginBottom;
            }
            return height;
        }, 0);
        

        // Figure out starting vertical position
        let startY = 0;
        switch (position[1]) {
            case 'top':
                startY = (-this.sizeH / 2) + this.padding;
                break;
            case 'bottom':
                startY = (this.sizeH / 2) - (totalContentHeight+fixedContentHeight) - this.padding;
                break;
            default:
                startY = -(totalContentHeight+fixedContentHeight) / 2;
                break;
        }

        // Figure out starting horizontal position
        let startX, originX;
        let scrollableX = (-this.sizeW / 2) + this.padding; // Scrollable content always starts left
        let scrollableOriginX = 0;
        switch (position[0]) {
            case 'left':
                startX = (-this.sizeW / 2) + this.padding;
                originX = 0;
                break;
            case 'right':
                startX = (this.sizeW / 2) - this.padding;
                originX = 1;
                break;
            default:
                startX = 0;
                originX = 0.5;
                break;
        }

        let posY = startY;
        const allContent = [...this.fixedContent, ...this.content];
        // Loop thrugh all elements positioning them correctly
        allContent.forEach((element, index) => {
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
                }, 0) + (element.length - 1) * this.marginRight;
                let posX = startX;

                if(element.length >= 1){
                    // Figure out starting horizontal position if first element of the array is inside UIComponent directly (therefore part of fixed content)
                    if(!this.scrollable || element[0].parentContainer instanceof UIComponent){
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
                    }
                    else{ // Otherwise its part of the content container and if scrolling is enabled, should be positioned left most no matter what
                        if(this.scrollable){
                            posX = scrollableX;
                        }
                    }
                }
            
                
                if(isLayoutElement(element[0])) posY += element[0].displayHeight/2; // Change Y coordinate of this row based on half height of the first element
                // Loop thru the elements inside array and position them correctly in current row
                element.forEach(e => {
                    if(isLayoutElement(e)){
                        if(e instanceof Phaser.GameObjects.Container){
                            e.setPosition(posX+(e.displayWidth/2), posY);
                        }
                        else{
                            // @ts-ignore
                            if('setOrigin' in e) e.setOrigin(0, 0.5);
                            e.setPosition(posX, posY);
                        }
                        posX += e.displayWidth + this.marginRight;
                    }
                });
                // Move to next row by half height of first element in array and gap
                if(isLayoutElement(element[0])) posY += element[0].displayHeight/2 + this.marginBottom;
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
                    posY += element.displayHeight + this.marginBottom;
                    
                    
                }
            }
        
        });
    }

    private getLocalY(globalY: number): number {
        return globalY - (this.y - this.sizeH / 2);
    }

    private getLocalX(globalX: number): number {
        return globalX - (this.x - this.sizeW / 2);
    }

    private startDrag(pointer: Phaser.Input.Pointer): void {
        // Only allow drag if content is overflowing
        if (this.scrollLimitsY.minY >= 0 && this.scrollLimitsX.minX >= 0) return;
        this.isDragging = true;
        this.wasDragged = false;
        this.scene.input.on('pointermove', this.doDrag, this);
        this.scene.input.once('pointerup', this.stopDrag, this);
        this.scene.input.once('gameout',  this.stopDrag, this);
        this.dragStartY = this.getLocalY(pointer.y);
        this.dragStartScrollY = this.contentContainer.y;
        this.dragStartX = this.getLocalX(pointer.x); 
        this.dragStartScrollX = this.contentContainer.x;
    }

    private stopDrag(): void {
        this.isDragging = false;
        this.wasDragged = false;
        this.scene.input.off('pointermove', this.doDrag, this);

        // 2. Determine target X and Y positions
        let targetX = this.contentContainer.x;
        let targetY = this.contentContainer.y;

        // Check X-axis limits
        if (targetX > this.scrollLimitsX.maxX) {
            targetX = this.scrollLimitsX.maxX;
        } else if (targetX < this.scrollLimitsX.minX) {
            targetX = this.scrollLimitsX.minX;
        }

        // Check Y-axis limits
        if (targetY > this.scrollLimitsY.maxY) {
            targetY = this.scrollLimitsY.maxY;
        } else if (targetY < this.scrollLimitsY.minY) {
            targetY = this.scrollLimitsY.minY;
        }

        // 3. If content is outside the bounds, tween it back
        if (targetX !== this.contentContainer.x || targetY !== this.contentContainer.y) {
            this.scene.tweens.add({
                targets: this.contentContainer,
                x: targetX,
                y: targetY,
                duration: 300,
                ease: 'Quart.easeOut',
            });
        }
    }

    private doDrag(pointer: Phaser.Input.Pointer): void {
        if (!this.isDragging) return;
        // --- X-Axis Logic ---
        const isScrollableX = this.scrollLimitsX.minX < 0;
        if (isScrollableX) {
            const currentLocalX = this.getLocalX(pointer.x);
            const deltaX = currentLocalX - this.dragStartX;

            // Only allow dragging if the drag distance is greater than the threshold
            if (Math.abs(deltaX) > this.dragThreshold) {
                this.wasDragged = true;
            }
            if (!this.wasDragged) return;

            let newX = this.dragStartScrollX + deltaX;
            
            if (newX > this.scrollLimitsX.maxX) {
                const overshoot = newX - this.scrollLimitsX.maxX;
                newX = this.scrollLimitsX.maxX + overshoot * 0.5;
            } else if (newX < this.scrollLimitsX.minX) {
                const undershoot = this.scrollLimitsX.minX - newX;
                newX = this.scrollLimitsX.minX - undershoot * 0.5;
            }

            this.contentContainer.x = newX;
        }
        
        // --- Y-Axis Logic ---
        const isScrollableY = this.scrollLimitsY.minY < 0;
        if (isScrollableY) {
            const currentLocalY = this.getLocalY(pointer.y);
            const deltaY = currentLocalY - this.dragStartY;

            // Calculate new Y position, applying it to the scroll container
            let newY = this.dragStartScrollY + deltaY;

            if (newY > this.scrollLimitsY.maxY) {
                const overshoot = newY - this.scrollLimitsY.maxY;
                newY = this.scrollLimitsY.maxY + overshoot * 0.5;
            } else if (newY < this.scrollLimitsY.minY) {
                const undershoot = this.scrollLimitsY.minY - newY;
                newY = this.scrollLimitsY.minY - undershoot * 0.5;
            }
        }
    }
}
