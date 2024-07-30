import React, { useState, useEffect, useRef } from 'react';
import './style.css';

const Carousel = ({ images }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [scrollText, setScrollText] = useState(false);
    const carouselRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((currentSlide + 1) % images.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [currentSlide, images.length]);

    useEffect(() => {
        setScrollText(true);

        const timeout = setTimeout(() => {
            setScrollText(false);
        }, 3000);

        return () => clearTimeout(timeout);
    }, [currentSlide]);

    const showSlider = (type) => {
        let newSlide;
        if (type === 'next') {
            newSlide = (currentSlide + 1) % images.length;
            setCurrentSlide(newSlide);
        } else {
            newSlide = (currentSlide - 1 + images.length) % images.length;
            const currentItem = carouselRef.current.querySelector(`.item:nth-child(${currentSlide + 1})`);
            currentItem.classList.add('zoom-out');
            setTimeout(() => {
                currentItem.classList.remove('zoom-out');
                setCurrentSlide(newSlide);
            }, 600); // Duration should match the CSS transition time
        }
    };

    const handleButtonClick = (type) => {
        if (type === 'next') {
            showSlider('next');
        } else {
            showSlider('prev');
        }
    };

    useEffect(() => {
        const nextDom = document.getElementById('next');
        const prevDom = document.getElementById('prev');
        const carouselDom = document.querySelector('.carousel');
        const SliderDom = carouselDom.querySelector('.carousel .list');
        const thumbnailBorderDom = document.querySelector('.carousel .thumbnail');
        const timeRunning = 3000;
        const timeAutoNext = 7000;

        let thumbnailItemsDom = Array.from(thumbnailBorderDom.querySelectorAll('.item')); // Convert NodeList to Array

        // Ensure first index of thumbnails matches first index of carousel images
        thumbnailBorderDom.appendChild(thumbnailItemsDom[0]);

        let runTimeOut;
        let runNextAuto = setTimeout(() => {
            nextDom.click();
        }, timeAutoNext);

        nextDom.onclick = function() {
            showSlider('next');
        };

        prevDom.onclick = function() {
            showSlider('prev');
        };

        function showSlider(type) {
            let SliderItemsDom = Array.from(SliderDom.querySelectorAll('.carousel .list .item'));
            let thumbnailItemsDom = Array.from(document.querySelectorAll('.carousel .thumbnail .item'));

            if (type === 'next') {
                let shiftedThumbnail = thumbnailItemsDom.shift(); // Remove the first item
                thumbnailItemsDom.push(shiftedThumbnail); // Add it to the end
                SliderDom.appendChild(SliderItemsDom[0]); // Move the first slide to the end
                carouselDom.classList.add('next');
            } else {
                let poppedThumbnail = thumbnailItemsDom.pop(); // Remove the last item
                thumbnailItemsDom.unshift(poppedThumbnail); // Add it to the beginning
                SliderDom.prepend(SliderItemsDom[SliderItemsDom.length - 1]); // Move the last slide to the beginning
                carouselDom.classList.add('prev');
            }

            clearTimeout(runTimeOut);
            runTimeOut = setTimeout(() => {
                carouselDom.classList.remove('next');
                carouselDom.classList.remove('prev');
            }, timeRunning);

            clearTimeout(runNextAuto);
            runNextAuto = setTimeout(() => {
                nextDom.click();
            }, timeAutoNext);
        }

        return () => {
            clearTimeout(runNextAuto);
            clearTimeout(runTimeOut);
        };
    }, [images]);

    const reorderImages = (images, currentIndex) => {
        // Ensure the current index is the last index
        const reordered = [...images.slice(currentIndex), ...images.slice(0, currentIndex)];
        
        // Ensure the reordered array always starts with the last index image
        const lastIndex = images.length - 1;
        return [...reordered.slice(lastIndex), ...reordered.slice(0, lastIndex)];
    };

    const reorderedImages = reorderImages(images, currentSlide);

    return (
        <div className="carousel" ref={carouselRef}>
            <div className="list">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`item ${index === currentSlide ? 'active' : ''} ${scrollText ? 'scroll-down' : ''}`}
                        style={{ zIndex: index === currentSlide ? 1 : 0 }}
                    >
                        <img src={image.src} alt={image.alt} />
                        <div className="content">
                            <div className="author">{image.author}</div>
                            <div className="title">{image.title}</div>
                            <div className="topic">{image.topic}</div>
                            <div className="del">{image.del}</div>
                            <div className="buttons">
                                <button>SEE MORE</button>
                                <button>SUBSCRIBE</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="thumbnail">
                {reorderedImages.map((image, index) => (
                    <div className="item" key={index}>
                        <img src={image.src} alt={image.alt} />
                        <div className="content">
                            <div className="title">{image.title}</div>
                            <div className="description">{image.description}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="arrows">
                <button id="prev" onClick={() => handleButtonClick('prev')}>&lt;</button>
                <button id="next" onClick={() => handleButtonClick('next')}>&gt;</button>
            </div>
            <div className="time"></div>
        </div>
    );
};

export default Carousel;
