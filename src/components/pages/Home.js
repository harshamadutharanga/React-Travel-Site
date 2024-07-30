import React from 'react';
import './style.css'
import Carousel from './Carousel';
import img1 from '../images/img1.jpg'; // Import image 1
import img2 from '../images/img2.jpg'; // Import image 2
import img3 from '../images/img3.jpg'; // Import image 2
import img4 from '../images/img4.jpg'; // Import image 2
// Import additional images as needed

const Home = () => {
    const images = [
        {
            src: img1, // Use imported image variable
            alt: 'Image 1',
            author: 'LUNDEV',
            title: 'DESIGN SLIDER',
            topic: 'ANIMAL',
            description: 'Bull1',
            del: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit...',
        },
        {
            src: img2, // Use imported image variable
            alt: 'Image 2',
            author: 'LUNDEV',
            title: 'DESIGN SLIDER',
            topic: 'ANIMAL',
            description: 'Bull2',
            del: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit...',
        },
        {
            src: img3, // Use imported image variable
            alt: 'Image 3',
            author: 'LUNDEV',
            title: 'DESIGN SLIDER',
            topic: 'ANIMAL',
            description: 'Elephant',
            del: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit...',
        },
        {
            src: img4, // Use imported image variable
            alt: 'Image 4',
            author: 'LUNDEV',
            title: 'DESIGN SLIDER',
            topic: 'ANIMAL',
            description: 'Tiger',
            del: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit...',
            
        },
        // Add more images as needed
    ];

    return (
        <div className="App">
            <Carousel images={images} />
        </div>
    );
};

export default Home;
