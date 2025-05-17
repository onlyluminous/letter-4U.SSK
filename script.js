document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要交互的元素
    const contentStage1 = document.getElementById('content-stage-1');
    const contentStage2 = document.getElementById('content-stage-2');
    const contentStage3 = document.getElementById('content-stage-3');
    const contentStageFinal = document.getElementById('content-stage-final');
    
    const nextBtn = document.getElementById('nextBtn');
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const mainHeart = document.getElementById('mainHeart');
    
    // 当前展示阶段
    let currentStage = 1;
    
    // 设置当前日期
    const now = new Date();
    if(document.getElementById('current-date')) {
        document.getElementById('current-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    
    // 禁用双击缩放
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // 音频处理函数
    function setupAudio() {
        const bgMusic = document.getElementById('bgMusic');
        const musicControl = document.getElementById('musicControl');
        const backupPlayButton = document.getElementById('backupPlayButton');
        
        // 设置初始音量
        bgMusic.volume = 0.6;

        // 预加载音频
        bgMusic.preload = 'auto';
        
        // 添加缓冲检测
        bgMusic.addEventListener('waiting', function() {
            console.log('音频缓冲中...');
            musicControl.style.opacity = '0.5';
        });
        
        bgMusic.addEventListener('canplaythrough', function() {
            console.log('音频已完全加载');
            musicControl.style.opacity = '1';
        });
            
        // 播放音乐并添加旋转效果
        function playWithRotation() {
            // 确保音频已经准备好
            if (bgMusic.readyState < 3) {
                console.log('等待音频加载...');
                bgMusic.addEventListener('canplay', function onCanPlay() {
                    bgMusic.currentTime = 17;
                    bgMusic.play().then(() => {
                        musicControl.classList.add('music-rotating');
                        backupPlayButton.classList.remove('show');
                    }).catch(handlePlayError);
                    bgMusic.removeEventListener('canplay', onCanPlay);
                });
                return;
            }

            bgMusic.currentTime = 17;
            return bgMusic.play().then(() => {
                musicControl.classList.add('music-rotating');
                backupPlayButton.classList.remove('show');
            }).catch(handlePlayError);
        }

        function handlePlayError(error) {
            console.error('播放出错:', error);
            backupPlayButton.classList.add('show');
        }

        // 暂停音乐并移除旋转效果
        function pauseWithRotation() {
            bgMusic.pause();
            musicControl.classList.remove('music-rotating');
        }

        // 音乐控制按钮点击事件
        musicControl.addEventListener('click', function() {
            if (bgMusic.paused) {
                playWithRotation();
            } else {
                pauseWithRotation();
            }
        });
        
        // 备用播放按钮事件
        backupPlayButton.addEventListener('click', function() {
            playWithRotation().catch(() => {
                alert('音乐播放失败，请检查浏览器设置或点击页面任意位置');
            });
        });

        // 点击页面任意位置播放
        document.addEventListener('click', function(e) {
            // 如果点击的是音乐控制按钮，不处理
            if (e.target.closest('.music-control')) {
                return;
            }
            
            if (bgMusic.paused) {
                playWithRotation();
            }
        }, { once: true });

        // 监听音频播放状态
        bgMusic.addEventListener('play', () => {
            musicControl.classList.add('music-rotating');
        });
        
        bgMusic.addEventListener('pause', () => {
            musicControl.classList.remove('music-rotating');
        });
    }
    
    // 创建漂浮爱心背景
    function createFloatingHearts() {
        const container = document.querySelector('.floating-hearts');
        const heartCount = Math.min(12, Math.floor(window.innerWidth / 50)); // 减少心形数量

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '❤';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDelay = Math.random() * 8 + 's';
            container.appendChild(heart);
        }
    }

    // 优化的心形爆发效果
    const debouncedCreateHeartBurst = debounce(function() {
        const hearts = Math.min(6, Math.floor(window.innerWidth / 80));
        const container = document.body;
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < hearts; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤';
            heart.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                color: #ff4d6d;
                font-size: 20px;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                animation: float ${2 + Math.random() * 1}s linear forwards;
            `;
            fragment.appendChild(heart);
            
            setTimeout(() => heart.remove(), 2000);
        }
        container.appendChild(fragment);
    }, 100);

    // 优化的烟花效果
    const debouncedCreateFireworks = debounce(function() {
        const colors = ['#ff4d6d', '#ff85a1', '#ffc0cb', '#ff69b4'];
        const particleCount = Math.min(30, Math.floor(window.innerWidth / 25));
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < particleCount; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            fragment.appendChild(firework);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            const size = Math.random() * 3 + 1;
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = size + 'px';
            firework.style.height = size + 'px';
            
            requestAnimationFrame(() => {
                document.body.appendChild(fragment);
                animateFirework(firework, angle, velocity);
            });
        }
    }, 100);

    function animateFirework(firework, angle, velocity) {
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            let x = startX;
            let y = startY;
            
        function animate() {
                x += Math.cos(angle) * velocity;
                y += Math.sin(angle) * velocity - 0.5;
                
            firework.style.transform = `translate(${x}px, ${y}px)`;
                
                if (y < window.innerHeight) {
                    requestAnimationFrame(animate);
                } else {
                    firework.remove();
                }
        }
        
        requestAnimationFrame(animate);
    }
    
    // 按钮躲避效果
    function setupButtonDodge() {
        let lastTouchTime = 0;
        const noBtnTexts = [
            "再想想",
            "不要嘛～",
            "再考虑一下嘛",
            "别点我～",
            "再思索一下呀",
            "讨厌啦～",
            "你就答应嘛",
            "给个机会嘛",
            "你忍心拒绝我吗",
            "我会难过的～"
        ];
        let textIndex = 0;
        
        function handleButtonDodge(e) {
            const now = Date.now();
            if (now - lastTouchTime < 100) return;
            lastTouchTime = now;
            
            const noBtn = document.getElementById('noBtn');
            const container = document.querySelector('.dodge-container');
            
            // 第一次触发时，将按钮移动到dodge-container中
            if (noBtn.classList.contains('initial')) {
                noBtn.classList.remove('initial');
                container.appendChild(noBtn);
            }
            
            const containerRect = container.getBoundingClientRect();
            
            // 计算可移动范围
            const maxX = containerRect.width - noBtn.offsetWidth;
            const maxY = containerRect.height - noBtn.offsetHeight;
            
            // 生成新位置
            const newX = Math.random() * maxX;
            const newY = Math.random() * maxY;
            
            // 应用新位置
            noBtn.style.left = newX + 'px';
            noBtn.style.top = newY + 'px';
            
            // 更改按钮文字
            noBtn.textContent = noBtnTexts[textIndex];
            textIndex = (textIndex + 1) % noBtnTexts.length;
            
            // 添加移动类
            noBtn.classList.add('moving');
        }
        
        const noBtn = document.getElementById('noBtn');
        noBtn.addEventListener('mouseover', handleButtonDodge);
        noBtn.addEventListener('touchstart', handleButtonDodge);
    }
    
    // "好呀"按钮点击效果
    function handleSuccess(e) {
        if (e) e.preventDefault();
        
        // 隐藏所有阶段
        contentStage1.classList.remove('active');
        contentStage2.classList.remove('active');
        contentStage3.classList.remove('active');
        
        // 显示最终阶段
        contentStageFinal.classList.add('active');
        
        // 更新日期
        const now = new Date();
        if(document.getElementById('current-date')) {
            document.getElementById('current-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        }
        
        // 确保音乐在点击"好呀"后播放
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic.paused) {
            bgMusic.play().catch(error => console.log('无法自动播放音乐:', error));
            document.getElementById('musicControl').classList.add('music-rotating');
        }
        
        // 添加特效
        debouncedCreateFireworks();
        debouncedCreateHeartBurst();
        
        // 隐藏按钮
        nextBtn.style.display = 'none';
        noBtn.style.display = 'none';
        yesBtn.style.display = 'none';
    }
    
    // 切换到下一个阶段
    function nextStage() {
        // 隐藏所有阶段
        contentStage1.classList.remove('active');
        contentStage2.classList.remove('active');
        contentStage3.classList.remove('active');
        contentStageFinal.classList.remove('active');
        
        // 切换阶段
        currentStage++;
        
        // 根据当前阶段显示内容
        if (currentStage === 2) {
            contentStage2.classList.add('active');
            nextBtn.textContent = '还有更多';
        } else if (currentStage === 3) {
            contentStage3.classList.add('active');
            nextBtn.textContent = '回到开始';
        } else {
            currentStage = 1;
            contentStage1.classList.add('active');
            nextBtn.textContent = '继续了解';
        }
        
        // 特效
        debouncedCreateHeartBurst();
    }
    
    // 优化点击和触摸事件
    let touchTimeout;
    mainHeart.addEventListener('click', debounce(debouncedCreateHeartBurst, 300));
    mainHeart.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (touchTimeout) clearTimeout(touchTimeout);
        touchTimeout = setTimeout(debouncedCreateHeartBurst, 300);
    });

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 设置按钮事件
    function setupButtons() {
        let yesClickCount = 0;
        const confirmTexts = [
            "真的吗？人家好开心呀~",
            "再说一次嘛，人家还想听~",
            "太好啦！我们在一起吧！"
        ];
        
        yesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            yesClickCount++;
            
            // 创建心形特效
            debouncedCreateHeartBurst();
            
            if (yesClickCount < 3) {
                // 更新按钮文字
                this.textContent = confirmTexts[yesClickCount - 1];
                
                // 添加按钮动画
                this.classList.add('button-pulse');
                setTimeout(() => this.classList.remove('button-pulse'), 500);
            } else {
                // 第三次点击时执行成功效果
                handleSuccess();
            }
        });
        
        yesBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.click();
        });
        
        nextBtn.addEventListener('click', nextStage);
        nextBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            nextStage();
        });
    }
    
    // 初始化
    function init() {
        // 创建漂浮爱心背景
        createFloatingHearts();
        
        // 设置按钮躲避效果
        setupButtonDodge();
        
        // 设置音频
        setupAudio();
        
        // 设置按钮事件
        setupButtons();
    }
    
    // 初始化
    init();
}); 