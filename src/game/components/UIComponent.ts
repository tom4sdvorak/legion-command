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
     * @param scrollable A boolean indicating whether the component should be scrollable or not.
     */
export class UIComponent extends Phaser.GameObjects.Container {
    private border: Phaser.GameObjects.NineSlice;
    private background: Phaser.GameObjects.TileSprite;
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
    private scrollbarTrackV: Phaser.GameObjects.Graphics | null = null;
    private scrollbarThumbV: Phaser.GameObjects.Graphics | null = null;
    private scrollbarTrackH: Phaser.GameObjects.Graphics | null = null;
    private scrollbarThumbH: Phaser.GameObjects.Graphics | null = null;
    private scrollbarWidth: number = 8;
    private scrollbarPadding: number = 4;
    public trackColor = 0x2d3436;
    public thumbColor = 0xFFFF00;

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
        this.background = this.scene.add.tileSprite(-width/2, -height/2, width, height, chosenBackground);
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
            this.createScrollbar();
        }
    }

    public destroy(fromScene: boolean = true): void {
        this.border.destroy(fromScene);
        this.background.destroy(fromScene);
        this.borderStroke.destroy(fromScene);
        if (this.contentMaskGraphics) this.contentMaskGraphics.destroy(fromScene);
        this.contentContainer.destroy(fromScene);
        if (this.scrollbarTrackV) this.scrollbarTrackV.destroy(fromScene);
        if (this.scrollbarThumbV) this.scrollbarThumbV.destroy(fromScene);
        if (this.scrollbarTrackH) this.scrollbarTrackH.destroy(fromScene);
        if (this.scrollbarThumbH) this.scrollbarThumbH.destroy(fromScene);
        this.removeAllListeners();
        super.destroy(fromScene);
    }

    public getChildrenByType(type: string) : Phaser.GameObjects.GameObject[] {
        const returnArray : Phaser.GameObjects.GameObject[] = [];
        console.log("CHECKING CHILDREN", [...this.content, ...this.fixedContent]);
        for (const child of [...this.content, ...this.fixedContent]) {
            console.log(child, child.constructor.name, type);
            if (child instanceof Phaser.GameObjects.GameObject && child.constructor.name === type) {
                returnArray.push(child);
            }
        }
        return returnArray;
    }

    private createMask(){
        if(this.contentMaskGraphics) this.contentMaskGraphics.clear();
        this.contentMaskGraphics.fillStyle(0x000000, 0);
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

    private createScrollbar(): void {
        if (!this.scrollable) return;

        const contentW = this.sizeW - this.padding * 2;
        const contentH = this.sizeH - this.padding * 2;
        
        // 1. Vertical Scrollbar (Right Side)
        const trackVX = this.sizeW / 2 - this.padding - this.scrollbarPadding - this.scrollbarWidth;
        const trackVY = -this.sizeH / 2 + this.padding;
        
        this.scrollbarTrackV = this.scene.add.graphics({ fillStyle: { color: this.trackColor, alpha: 0.1 } });
        this.scrollbarTrackV.fillRect(trackVX, trackVY, this.scrollbarWidth, contentH);
        this.add(this.scrollbarTrackV);
        
        this.scrollbarThumbV = this.scene.add.graphics({ fillStyle: { color: this.thumbColor, alpha: 0.8 }, lineStyle: { color: 0x000000, width: 8 } });
        this.scrollbarThumbV.fillRect(trackVX, trackVY, this.scrollbarWidth, this.scrollbarWidth * 2);
        this.scrollbarThumbV.strokeRect(trackVX, trackVY, this.scrollbarWidth, this.scrollbarWidth * 2); 
        this.add(this.scrollbarThumbV);

        this.fixedContent.push(this.scrollbarTrackV);
        this.fixedContent.push(this.scrollbarThumbV);

        // 2. Horizontal Scrollbar (Bottom Side)
        const trackHX = -this.sizeW / 2 + this.padding;
        const trackHY = this.sizeH / 2 - this.padding - this.scrollbarPadding - this.scrollbarWidth;

        this.scrollbarTrackH = this.scene.add.graphics({ fillStyle: { color: this.trackColor, alpha: 0.1 } });
        this.scrollbarTrackH.fillRect(trackHX, trackHY, contentW, this.scrollbarWidth);
        this.add(this.scrollbarTrackH);

        this.scrollbarThumbH = this.scene.add.graphics({ fillStyle: { color: this.thumbColor, alpha: 0.8 }, lineStyle: { color: 0x000000, width: 2 } });
        this.scrollbarThumbH.fillRect(trackHX, trackHY, this.scrollbarWidth * 2, this.scrollbarWidth);
        this.scrollbarThumbH.strokeRect(trackHX, trackHY, this.scrollbarWidth * 2, this.scrollbarWidth); 
        this.add(this.scrollbarThumbH);

        this.fixedContent.push(this.scrollbarTrackH);
        this.fixedContent.push(this.scrollbarThumbH);
        
        this.updateScrollbar();
    }

    private updateScrollbar(): void {
        if (!this.scrollable || !this.scrollbarThumbV || !this.scrollbarTrackV || !this.scrollbarThumbH || !this.scrollbarTrackH) return;
        
        const availableWidth = this.sizeW - (this.padding * 2);
        const availableHeight = this.sizeH - (this.padding * 2);

        const totalContentHeight = this.calculateTotalContentHeight();
        const totalContentWidth = this.calculateTotalContentWidth();

        const scrollableY = totalContentHeight > availableHeight;
        const scrollableX = totalContentWidth > availableWidth;
        
        // Determine effective track size based on whether the other scrollbar is visible
        const trackHeightV = availableHeight - (scrollableX ? this.scrollbarWidth + this.scrollbarPadding : 0);
        const trackWidthH = availableWidth - (scrollableY ? this.scrollbarWidth + this.scrollbarPadding : 0);
        
        /*const thumbColor = 0x34d399; // Green (Tailwind emerald)
        const trackColor = 0x2d3436; // Dark gray*/

        // 1. Update Vertical Scrollbar (Y)
        if (scrollableY) {
            this.scrollbarThumbV.setVisible(true);
            this.scrollbarTrackV.setVisible(true);

            // Redraw Vertical Track based on new height
            const trackVX = this.sizeW / 2 - this.padding - this.scrollbarPadding - this.scrollbarWidth;
            const trackVY = -this.sizeH / 2 + this.padding;
            
            this.scrollbarTrackV.clear();
            this.scrollbarTrackV.fillStyle(this.trackColor, 0.1);
            this.scrollbarTrackV.fillRect(trackVX, trackVY, this.scrollbarWidth, trackHeightV);

            // Calculate proportional thumb height
            const scrollRangeY = this.scrollLimitsY.minY; // This is a negative value
            const minThumbHeight = this.scrollbarWidth * 2;
            const proportionalHeight = (availableHeight / totalContentHeight) * trackHeightV;
            const thumbHeight = Math.max(proportionalHeight, minThumbHeight);
            
            // Calculate proportional position
            const scrollRatioY = Phaser.Math.Clamp(-this.contentContainer.y / -scrollRangeY, 0, 1);
            const thumbYOffset = scrollRatioY * (trackHeightV - thumbHeight);
            
            // Redraw Thumb V
            this.scrollbarThumbV.clear();
            this.scrollbarThumbV.fillStyle(this.thumbColor, 0.8);
            this.scrollbarThumbV.lineStyle(1, 0x000000);
            this.scrollbarThumbV.fillRect(trackVX, trackVY + thumbYOffset, this.scrollbarWidth, thumbHeight);
            this.scrollbarThumbV.strokeRect(trackVX, trackVY + thumbYOffset, this.scrollbarWidth, thumbHeight);

        } else {
            this.scrollbarThumbV.setVisible(false);
            this.scrollbarTrackV.setVisible(false);
        }

        // 2. Update Horizontal Scrollbar (X)
        if (scrollableX) {
            this.scrollbarThumbH.setVisible(true);
            this.scrollbarTrackH.setVisible(true);
            
            // Redraw Horizontal Track based on new width
            const trackHX = -this.sizeW / 2 + this.padding;
            const trackHY = this.sizeH / 2 - this.padding - this.scrollbarPadding - this.scrollbarWidth;
            
            this.scrollbarTrackH.clear();
            this.scrollbarTrackH.fillStyle(this.trackColor, 0.1);
            this.scrollbarTrackH.fillRect(trackHX, trackHY, trackWidthH, this.scrollbarWidth);

            // Calculate proportional thumb width
            const scrollRangeX = this.scrollLimitsX.minX; // This is a negative value
            const minThumbWidth = this.scrollbarWidth * 2;
            const proportionalWidth = (availableWidth / totalContentWidth) * trackWidthH;
            const thumbWidth = Math.max(proportionalWidth, minThumbWidth);

            // Calculate proportional position
            const scrollRatioX = Phaser.Math.Clamp(-this.contentContainer.x / -scrollRangeX, 0, 1);
            const thumbXOffset = scrollRatioX * (trackWidthH - thumbWidth);

            // Redraw Thumb H
            this.scrollbarThumbH.clear();
            this.scrollbarThumbH.fillStyle(this.thumbColor, 0.8);
            this.scrollbarThumbH.lineStyle(1, 0x000000);
            this.scrollbarThumbH.fillRect(trackHX + thumbXOffset, trackHY, thumbWidth, this.scrollbarWidth);
            this.scrollbarThumbH.strokeRect(trackHX + thumbXOffset, trackHY, thumbWidth, this.scrollbarWidth);

        } else {
            this.scrollbarThumbH.setVisible(false);
            this.scrollbarTrackH.setVisible(false);
        }
    }

    private calculateTotalContentHeight(): number {
        const itemCount = this.content.length;
        return this.content.reduce((height, obj) => {
            // Helper function for typescript to check element properties/methods
            function isLayoutElement(element: any): element is { displayHeight: number } {
                return 'displayHeight' in element;
            }
            
            const item = Array.isArray(obj) ? obj[0] : obj;
            if(isLayoutElement(item)){
                return height + item.displayHeight;
            }
            else{
                return height;
            }
        }, 0) + (itemCount - 1) * this.marginBottom;
    }

    private calculateTotalContentWidth(): number {
        return this.content.reduce((width, obj) => {
            function isLayoutElement(element: any): element is { displayWidth: number } {
                return 'displayWidth' in element;
            }

            if(Array.isArray(obj)){
                let rowWidth = 0;
                for(const item of obj){
                    if(isLayoutElement(item)){
                        rowWidth += item.displayWidth;
                    }
                }
                // Add margin only between elements in the row
                const rowTotalWidth = rowWidth + (obj.length > 0 ? (obj.length - 1) * this.marginRight : 0);
                return Math.max(width, rowTotalWidth);
            }
            else{
                if(isLayoutElement(obj)){
                    return Math.max(width, obj.displayWidth);
                }
                else{
                    return width;
                }
            }
        }, 0);
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
        const totalContentHeight = this.calculateTotalContentHeight();

        // Calculate width of largestnon-fixed element (or sum of elements if they are inside array)
        const totalContentWidth = this.calculateTotalContentWidth();

        if(this.scrollable){
            const availableHeight = this.sizeH - (this.padding * 2);
            this.scrollLimitsY.maxY = 0; 
            if (totalContentHeight > availableHeight) {
                this.scrollLimitsY.minY = availableHeight - totalContentHeight;
                this.contentContainer.y = Phaser.Math.Clamp(this.contentContainer.y, this.scrollLimitsY.minY, this.scrollLimitsY.maxY);
            } else {
                this.scrollLimitsY.minY = 0;
                this.contentContainer.y = 0;
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

            // Skip the scrollbar when calculating fixed content height
            if (item === this.scrollbarTrackV || item === this.scrollbarThumbV || item === this.scrollbarTrackH || item === this.scrollbarThumbH) return height;

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
            // Check if element is the scrollbar and skip position for it as it's handled separately
            if(element === this.scrollbarTrackV || element === this.scrollbarThumbV || element === this.scrollbarTrackH || element === this.scrollbarThumbH) return;

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

        this.updateScrollbar();
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
        this.scene?.input?.off('pointermove', this.doDrag, this);

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
                onUpdate: () => this.updateScrollbar() 
            });
        }
    }

    private doDrag(pointer: Phaser.Input.Pointer): void {
        if (!this.isDragging) return;

        const currentLocalY = this.getLocalY(pointer.y);
        const deltaY = currentLocalY - this.dragStartY;
        const currentLocalX = this.getLocalX(pointer.x);
        const deltaX = currentLocalX - this.dragStartX;
        
        // Check drag threshold
        if (Math.abs(deltaY) > this.dragThreshold || Math.abs(deltaX) > this.dragThreshold) {
            this.wasDragged = true;
        }
        if (!this.wasDragged) return;

        // --- X-Axis Logic ---
        const isScrollableX = this.scrollLimitsX.minX < 0;
        if (isScrollableX) {
            /*const currentLocalX = this.getLocalX(pointer.x);
            const deltaX = currentLocalX - this.dragStartX;

            // Only allow dragging if the drag distance is greater than the threshold
            if (Math.abs(deltaX) > this.dragThreshold) {
                this.wasDragged = true;
            }
            if (!this.wasDragged) return;*/

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
            /*const currentLocalY = this.getLocalY(pointer.y);
            const deltaY = currentLocalY - this.dragStartY;*/

            // Calculate new Y position, applying it to the scroll container
            let newY = this.dragStartScrollY + deltaY;

            if (newY > this.scrollLimitsY.maxY) {
                const overshoot = newY - this.scrollLimitsY.maxY;
                newY = this.scrollLimitsY.maxY + overshoot * 0.5;
            } else if (newY < this.scrollLimitsY.minY) {
                const undershoot = this.scrollLimitsY.minY - newY;
                newY = this.scrollLimitsY.minY - undershoot * 0.5;
            }
            this.contentContainer.y = newY;
        }

        this.updateScrollbar();
    }
}
